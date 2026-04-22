import { FilesetResolver, PoseLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.mjs";

const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_PATH = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let poseLandmarkerPromise = null;

function averagePoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    visibility: ((a.visibility ?? 0) + (b.visibility ?? 0)) / 2
  };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

async function getPoseLandmarker() {
  if (!poseLandmarkerPromise) {
    poseLandmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_PATH,
          delegate: "GPU"
        },
        runningMode: "IMAGE",
        numPoses: 1,
        outputSegmentationMasks: false,
        minPoseDetectionConfidence: 0.45,
        minPosePresenceConfidence: 0.45,
        minTrackingConfidence: 0.45
      });
    })();
  }

  return poseLandmarkerPromise;
}

async function analyzeImageElement(image) {
  const poseLandmarker = await getPoseLandmarker();
  const result = poseLandmarker.detect(image);
  const pose = result.landmarks?.[0];

  if (!pose) {
    return { ok: false, reason: "No person detected" };
  }

  const leftShoulder = pose[11];
  const rightShoulder = pose[12];
  const leftElbow = pose[13];
  const rightElbow = pose[14];
  const leftWrist = pose[15];
  const rightWrist = pose[16];
  const leftHip = pose[23];
  const rightHip = pose[24];
  const nose = pose[0];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return { ok: false, reason: "Body landmarks incomplete" };
  }

  const shouldersMid = averagePoint(leftShoulder, rightShoulder);
  const hipsMid = averagePoint(leftHip, rightHip);
  const shoulderSpan = distance(leftShoulder, rightShoulder);
  const torsoHeight = distance(shouldersMid, hipsMid);

  return {
    ok: true,
    landmarks: {
      nose: { x: nose?.x ?? shouldersMid.x, y: nose?.y ?? Math.max(0, shouldersMid.y - 0.16), visibility: nose?.visibility ?? 0 },
      leftShoulder: { x: leftShoulder.x, y: leftShoulder.y, visibility: leftShoulder.visibility ?? 0 },
      rightShoulder: { x: rightShoulder.x, y: rightShoulder.y, visibility: rightShoulder.visibility ?? 0 },
      leftElbow: { x: leftElbow?.x ?? leftShoulder.x - 0.05, y: leftElbow?.y ?? leftShoulder.y + 0.14, visibility: leftElbow?.visibility ?? 0 },
      rightElbow: { x: rightElbow?.x ?? rightShoulder.x + 0.05, y: rightElbow?.y ?? rightShoulder.y + 0.14, visibility: rightElbow?.visibility ?? 0 },
      leftWrist: { x: leftWrist?.x ?? leftShoulder.x - 0.07, y: leftWrist?.y ?? leftShoulder.y + 0.28, visibility: leftWrist?.visibility ?? 0 },
      rightWrist: { x: rightWrist?.x ?? rightShoulder.x + 0.07, y: rightWrist?.y ?? rightShoulder.y + 0.28, visibility: rightWrist?.visibility ?? 0 },
      leftHip: { x: leftHip.x, y: leftHip.y, visibility: leftHip.visibility ?? 0 },
      rightHip: { x: rightHip.x, y: rightHip.y, visibility: rightHip.visibility ?? 0 },
      shouldersMid,
      hipsMid
    },
    body: {
      shoulderSpan,
      torsoHeight
    }
  };
}

window.TryOnPose = {
  analyzeImageElement
};
