const state = {
  selectedProductId: 4,
  selectedSize: 'M',
  photoDataUrl: '',
  photoName: '',
  measurements: { chest: 36, waist: 32, height: 66, bodyType: 'slim' },
  pose: {
    status: 'idle',
    detected: false,
    message: 'Upload a clear portrait to scan shoulders and torso.',
    landmarks: null,
    body: null
  },
  overlay: { scale: 100, x: 0, y: 0, rotate: 0, opacity: 88 },
  ui: {
    compare: 100,
    split: 54,
    guides: true,
    fitClarity: true,
    mirrorPhoto: false,
    showAvatar: true,
    tryOnCategory: 'all',
    tryOnSearch: '',
    fitMode: 'balanced',
    overlayPreset: 'balanced',
    viewMode: 'overlay',
    orbitPreset: 'front',
    sceneOrbit: 0,
    sceneDepth: 26,
    sceneLift: 6
  }
};

const interaction = {
  mode: '',
  pointerId: null,
  startX: 0,
  startY: 0,
  startOverlay: null,
  startAngle: 0
};

const ORBIT_PRESETS = {
  front: { orbit: 0, depth: 26, lift: 6 },
  left: { orbit: -16, depth: 30, lift: 8 },
  right: { orbit: 16, depth: 30, lift: 8 },
  runway: { orbit: 10, depth: 38, lift: 12 }
};

const garmentAssetState = {};
const STORAGE_KEYS = {
  assets: 'tryon.customAssets.v1',
  placements: 'tryon.customPlacements.v1'
};
const customAssetLibrary = readStoredMap(STORAGE_KEYS.assets);
const customPlacementLibrary = readStoredMap(STORAGE_KEYS.placements);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readStoredMap(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
}

function persistStoredMap(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage failures so the studio still works in-memory.
  }
}

function productStorageKey(product) {
  if (!product) return '';
  return product.slug || String(product.id || '');
}

function productCustomAsset(product) {
  return customAssetLibrary[productStorageKey(product)] || '';
}

function resolvedOverlayAsset(product) {
  return productCustomAsset(product) || product?.overlayAsset || '';
}

function hasSavedPlacement(product) {
  return !!customPlacementLibrary[productStorageKey(product)];
}

function overlayPlacementForProduct(product, { includeCustom = true } = {}) {
  const customPlacement = includeCustom ? (customPlacementLibrary[productStorageKey(product)] || {}) : {};
  return {
    scaleAdjust: 0,
    xAdjust: 0,
    yAdjust: 0,
    rotateAdjust: 0,
    ...(product?.overlayPlacement || {}),
    ...customPlacement
  };
}

function resetPoseState(message = 'Upload a clear portrait to scan shoulders and torso.') {
  state.pose = {
    status: 'idle',
    detected: false,
    message,
    landmarks: null,
    body: null
  };
}

function photoLayoutMetrics() {
  const viewport = document.getElementById('try-on-viewport');
  const photo = document.getElementById('uploaded-photo');
  if (!viewport || !photo || !photo.naturalWidth || !photo.naturalHeight) return null;

  const viewportWidth = viewport.clientWidth || 320;
  const viewportHeight = viewport.clientHeight || 520;
  const scale = Math.max(viewportWidth / photo.naturalWidth, viewportHeight / photo.naturalHeight);
  const renderWidth = photo.naturalWidth * scale;
  const renderHeight = photo.naturalHeight * scale;

  return {
    viewportWidth,
    viewportHeight,
    renderWidth,
    renderHeight,
    offsetX: (viewportWidth - renderWidth) / 2,
    offsetY: 0
  };
}

function posePointToViewport(point, metrics) {
  return {
    x: metrics.offsetX + (point.x * metrics.renderWidth),
    y: metrics.offsetY + (point.y * metrics.renderHeight)
  };
}

function viewportPointToSvg(point, metrics) {
  return {
    x: (point.x / metrics.viewportWidth) * 320,
    y: (point.y / metrics.viewportHeight) * 520
  };
}

function blendPoint(a, b, t) {
  return {
    x: a.x + ((b.x - a.x) * t),
    y: a.y + ((b.y - a.y) * t)
  };
}

async function waitForPoseAnalyzer(timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const analyzer = window.TryOnPose?.analyzeImageElement;
    if (analyzer) return analyzer;
    await new Promise(resolve => setTimeout(resolve, 120));
  }
  return null;
}

function productAssetState(product) {
  const asset = resolvedOverlayAsset(product);
  if (!asset) return 'missing';
  return garmentAssetState[product.id] || 'pending';
}

function productAssetMessage(product) {
  const hasCustomAsset = !!productCustomAsset(product);
  const assetState = productAssetState(product);
  if (assetState === 'loaded') {
    return hasCustomAsset
      ? `Your saved transparent PNG for ${product.name} is active on this photo${hasSavedPlacement(product) ? ', with saved fit tuning for this garment.' : '.'}`
      : `Exact ${product.name} PNG is active on your photo.`;
  }
  if (assetState === 'missing') {
    return hasCustomAsset
      ? `The saved PNG for ${product.name} could not load, so the app is falling back to the smart preview.`
      : `${product.name} still needs a transparent PNG asset, so the app is showing the smart preview instead of the real selected garment.`;
  }
  return `Loading the exact ${product.name} PNG asset for this try-on.`;
}

function renderFitGuideOverlay(product) {
  const svg = document.getElementById('fit-guide-svg');
  if (!svg) return;

  const show = !!state.photoDataUrl && !!state.pose.detected && !!state.ui.fitClarity;
  svg.classList.toggle('active', show);
  if (!show || !product) {
    svg.innerHTML = '';
    return;
  }

  const metrics = photoLayoutMetrics();
  if (!metrics) {
    svg.innerHTML = '';
    return;
  }

  const type = productType(product);
  const landmarks = state.pose.landmarks;
  const leftShoulder = viewportPointToSvg(posePointToViewport(landmarks.leftShoulder, metrics), metrics);
  const rightShoulder = viewportPointToSvg(posePointToViewport(landmarks.rightShoulder, metrics), metrics);
  const leftHip = viewportPointToSvg(posePointToViewport(landmarks.leftHip, metrics), metrics);
  const rightHip = viewportPointToSvg(posePointToViewport(landmarks.rightHip, metrics), metrics);
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const waistY = (leftHip.y + rightHip.y) / 2;
  const hemY = type === 'bottom' ? Math.min(492, waistY + 146) : type === 'layer' ? waistY + 70 : type === 'top' ? waistY + 48 : waistY + 120;
  const leftEdge = Math.max(16, Math.min(leftShoulder.x, leftHip.x) - 26);
  const rightEdge = Math.min(304, Math.max(rightShoulder.x, rightHip.x) + 26);

  svg.innerHTML = `
    <defs>
      <linearGradient id="fitGlow" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(143,95,74,0)"/>
        <stop offset="50%" stop-color="rgba(143,95,74,.9)"/>
        <stop offset="100%" stop-color="rgba(143,95,74,0)"/>
      </linearGradient>
    </defs>
    <line x1="${leftShoulder.x}" y1="${shoulderY}" x2="${rightShoulder.x}" y2="${shoulderY}" stroke="rgba(143,95,74,.95)" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="${leftEdge}" y1="${waistY}" x2="${rightEdge}" y2="${waistY}" stroke="rgba(40,40,40,.34)" stroke-width="1.5" stroke-dasharray="5 6" stroke-linecap="round"/>
    <line x1="${leftEdge}" y1="${hemY}" x2="${rightEdge}" y2="${hemY}" stroke="url(#fitGlow)" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="${leftShoulder.x}" cy="${leftShoulder.y}" r="3.4" fill="#8f5f4a"/>
    <circle cx="${rightShoulder.x}" cy="${rightShoulder.y}" r="3.4" fill="#8f5f4a"/>
    <circle cx="${leftHip.x}" cy="${leftHip.y}" r="3.2" fill="rgba(17,17,17,.45)"/>
    <circle cx="${rightHip.x}" cy="${rightHip.y}" r="3.2" fill="rgba(17,17,17,.45)"/>
  `;
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const productId = Number(params.get('productId'));
  return Number.isFinite(productId) && productId > 0 ? productId : null;
}

function tryOnProducts() {
  return getAllProducts().filter(product => product.category === 'athletic');
}

function selectedProduct() {
  return getProductById(state.selectedProductId) || tryOnProducts()[0];
}

function tryOnCategoryMatches(product) {
  const filter = state.ui.tryOnCategory;

  if (filter === 'all') return true;
  if (filter === 'tops') return ['tops', 't-shirts'].includes(product.subcategory);
  if (filter === 'bottoms') return ['leggings', 'shorts', 'skort', 'pants', 'trousers'].includes(product.subcategory);
  if (filter === 'layers') return ['jackets'].includes(product.subcategory);

  return product.subcategory === filter;
}

function productType(product) {
  if (!product) return 'top';
  const sub = product.subcategory;
  if (sub === 'jackets') return 'layer';
  if (sub === 'leggings' || sub === 'shorts' || sub === 'skort' || sub === 'pants' || sub === 'trousers') return 'bottom';
  if (sub === 'sports-bra' || sub === 'tops' || sub === 't-shirts') return 'top';
  if (sub === 'shalwar-kameez' || sub === 'gown') return 'full';
  if (sub === 'kurta' || sub === 'shirt') return 'dress';
  return 'top';
}

function palette(color) {
  const raw = (color || '').toLowerCase();
  if (raw.includes('emerald')) return { fill: '#2d6a4f', shadow: '#1b4332', accent: '#d4af37' };
  if (raw.includes('gold') || raw.includes('saffron')) return { fill: '#ad7c2f', shadow: '#6b4b18', accent: '#f5d58f' };
  if (raw.includes('clay') || raw.includes('burnt') || raw.includes('cherry') || raw.includes('red')) return { fill: '#9f3d2f', shadow: '#562018', accent: '#f0b7a9' };
  if (raw.includes('lilac')) return { fill: '#9b83a8', shadow: '#5b4867', accent: '#eadff0' };
  if (raw.includes('taupe') || raw.includes('beige') || raw.includes('parchment') || raw.includes('oatmeal')) return { fill: '#b9a58e', shadow: '#746656', accent: '#f7efe2' };
  if (raw.includes('olive') || raw.includes('moss')) return { fill: '#59684f', shadow: '#323d2d', accent: '#c7d4bd' };
  if (raw.includes('white') || raw.includes('ivory') || raw.includes('cream')) return { fill: '#f6efe5', shadow: '#d4c5b5', accent: '#9f3d2f' };
  if (raw.includes('indigo') || raw.includes('navy')) return { fill: '#314c8a', shadow: '#1f2f54', accent: '#a7b8e8' };
  if (raw.includes('charcoal') || raw.includes('black') || raw.includes('obsidian')) return { fill: '#1f2430', shadow: '#0c1018', accent: '#b9c0d3' };
  if (raw.includes('maroon')) return { fill: '#6e2135', shadow: '#44101d', accent: '#e2a5b3' };
  if (raw.includes('sage')) return { fill: '#70876a', shadow: '#465641', accent: '#d8e7d0' };
  if (raw.includes('grey') || raw.includes('gray')) return { fill: '#7b7f88', shadow: '#545861', accent: '#dadde5' };
  return { fill: '#7f5a44', shadow: '#4f3728', accent: '#d8c2b3' };
}

function bodyScale() {
  if (state.measurements.bodyType === 'slim') return 0.92;
  if (state.measurements.bodyType === 'curvy') return 1.08;
  return 1;
}

function fitModeScale() {
  if (state.ui.fitMode === 'fitted') return 0.96;
  if (state.ui.fitMode === 'relaxed') return 1.05;
  return 1;
}

function fitCheckItems(product) {
  const type = productType(product);
  const ideal = smartOverlayValues(product);
  const xDelta = Math.abs(state.overlay.x - ideal.x);
  const yDelta = Math.abs(state.overlay.y - ideal.y);
  const scaleDelta = Math.abs(state.overlay.scale - ideal.scale);
  const rotateDelta = Math.abs(state.overlay.rotate - ideal.rotate);
  const upperLabel = type === 'bottom' ? 'Waist line' : 'Shoulders';
  const lowerLabel = type === 'bottom' ? 'Leg fall' : type === 'top' ? 'Hem line' : 'Length';

  if (!state.photoDataUrl) {
    return [
      {
        title: 'Photo',
        tone: 'soft',
        copy: 'Add a clear front-facing picture to unlock the easiest fitting check.'
      },
      {
        title: upperLabel,
        tone: 'soft',
        copy: `Use the guide model first, then upload your picture to check the ${upperLabel.toLowerCase()} more accurately.`
      },
      {
        title: lowerLabel,
        tone: 'soft',
        copy: `Once your picture is added, use Split Compare to judge the ${lowerLabel.toLowerCase()} cleanly.`
      }
    ];
  }

  return [
    {
      title: 'Photo',
      tone: state.pose.detected ? 'good' : 'warn',
      copy: state.pose.detected
        ? `${state.photoName || 'Your picture'} is loaded and the body scan found your shoulders and torso for a better wear preview.`
        : `${state.photoName || 'Your picture'} is loaded, but the body scan could not confidently read your pose yet.`
    },
    {
      title: upperLabel,
      tone: xDelta <= 14 && rotateDelta <= 5 ? 'good' : 'warn',
      copy: xDelta <= 14 && rotateDelta <= 5
        ? `The ${upperLabel.toLowerCase()} are sitting in a balanced position.`
        : `Nudge the look left or right a little to settle the ${upperLabel.toLowerCase()}.`
    },
    {
      title: lowerLabel,
      tone: yDelta <= 18 && scaleDelta <= 10 ? 'good' : 'warn',
      copy: yDelta <= 18 && scaleDelta <= 10
        ? `The ${lowerLabel.toLowerCase()} reads cleanly against your current frame.`
        : `Adjust scale or vertical position to refine the ${lowerLabel.toLowerCase()}.`
    }
  ];
}

function syncOverlayInputs() {
  [
    ['overlay-scale', state.overlay.scale],
    ['overlay-x', state.overlay.x],
    ['overlay-y', state.overlay.y],
    ['overlay-rotate', state.overlay.rotate],
    ['overlay-opacity', state.overlay.opacity]
  ].forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) input.value = value;
  });
}

function syncSceneInputs() {
  [
    ['scene-orbit', state.ui.sceneOrbit],
    ['scene-depth', state.ui.sceneDepth],
    ['scene-lift', state.ui.sceneLift]
  ].forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) input.value = value;
  });
}

function poseOverlayValues(product, fallback) {
  if (!state.photoDataUrl || !state.pose.detected || !state.pose.landmarks || !state.pose.body) {
    return fallback;
  }

  const metrics = photoLayoutMetrics();
  if (!metrics) return fallback;

  const type = productType(product);
  const shouldersMid = posePointToViewport(state.pose.landmarks.shouldersMid, metrics);
  const hipsMid = posePointToViewport(state.pose.landmarks.hipsMid, metrics);
  const shoulderSpanPx = state.pose.body.shoulderSpan * metrics.renderWidth;
  const torsoHeightPx = state.pose.body.torsoHeight * metrics.renderHeight;

  let scale = fallback.scale;
  let x = fallback.x;
  let y = fallback.y;

  if (type === 'top') {
    scale = clamp(Math.round((shoulderSpanPx / 1.1) + 2), 84, 132);
    x = Math.round(shouldersMid.x - (metrics.viewportWidth / 2));
    y = Math.round(shouldersMid.y - ((136 * scale) / 100));
  } else if (type === 'layer') {
    scale = clamp(Math.round((shoulderSpanPx / 1.02) + 8), 92, 142);
    x = Math.round(shouldersMid.x - (metrics.viewportWidth / 2));
    y = Math.round(shouldersMid.y - ((132 * scale) / 100));
  } else if (type === 'bottom') {
    scale = clamp(Math.round(((torsoHeightPx + shoulderSpanPx) / 2.1)), 88, 140);
    x = Math.round(hipsMid.x - (metrics.viewportWidth / 2));
    y = Math.round(hipsMid.y - ((236 * scale) / 100));
  } else if (type === 'dress' || type === 'full') {
    scale = clamp(Math.round(((shoulderSpanPx / 1.02) + (torsoHeightPx / 2.8))), 96, 145);
    x = Math.round(shouldersMid.x - (metrics.viewportWidth / 2));
    y = Math.round(shouldersMid.y - ((132 * scale) / 100));
  }

  return {
    scale,
    x: clamp(x, -110, 110),
    y: clamp(y, -90, 110),
    rotate: 0,
    opacity: clamp(Math.round((state.photoDataUrl ? 88 : fallback.opacity)), 50, 100)
  };
}

function applyOrbitPreset(preset) {
  const values = ORBIT_PRESETS[preset];
  if (!values) return;

  state.ui.orbitPreset = preset;
  state.ui.sceneOrbit = values.orbit;
  state.ui.sceneDepth = values.depth;
  state.ui.sceneLift = values.lift;
  syncSceneInputs();
  updateTryOn();
}

function smartOverlayValues(product, options = {}) {
  const type = productType(product);
  const heightFactor = (state.measurements.height - 66) * 0.9;
  const chestFactor = (state.measurements.chest - 36) * 0.6;
  const photoOffset = state.photoDataUrl ? -4 : 0;
  const presetFactor = {
    close: { scale: 4, y: -16, opacity: -2 },
    balanced: { scale: 0, y: 0, opacity: 0 },
    dramatic: { scale: 9, y: 18, opacity: 2 }
  }[state.ui.overlayPreset] || { scale: 0, y: 0, opacity: 0 };

  const baseByType = {
    top: { scale: 96, y: -8 },
    layer: { scale: 108, y: -4 },
    bottom: { scale: 104, y: 58 },
    dress: { scale: 108, y: 18 },
    full: { scale: 114, y: 26 }
  };

  const base = baseByType[type] || baseByType.top;
  const fitScale = state.ui.fitMode === 'relaxed' ? 3 : state.ui.fitMode === 'fitted' ? -2 : 0;
  const bodyShift = state.measurements.bodyType === 'curvy' ? 4 : state.measurements.bodyType === 'slim' ? -2 : 0;
  const placement = options.placement || overlayPlacementForProduct(product, { includeCustom: options.includeCustomPlacement !== false });

  const fallback = {
    scale: clamp(Math.round(base.scale + fitScale + chestFactor + photoOffset + presetFactor.scale + (placement.scaleAdjust || 0)), 70, 145),
    x: clamp(Math.round(placement.xAdjust || 0), -110, 110),
    y: clamp(Math.round(base.y + heightFactor + bodyShift + presetFactor.y + (placement.yAdjust || 0)), -90, 110),
    rotate: clamp(Math.round(placement.rotateAdjust || 0), -25, 25),
    opacity: clamp(Math.round((state.photoDataUrl ? 84 : 90) + presetFactor.opacity), 50, 100)
  };

  return poseOverlayValues(product, fallback);
}

function autoFitOverlay() {
  const product = selectedProduct();
  if (!product) return;
  state.overlay = smartOverlayValues(product);
  syncOverlayInputs();
  updateTryOn();
}

function fitScore(product) {
  const rec = recommendSize(product);
  const base = 72;
  const fitModeBoost = state.ui.fitMode === 'balanced' ? 8 : state.ui.fitMode === 'relaxed' ? 4 : 2;
  const photoBoost = state.photoDataUrl ? 8 : 0;
  const modeBoost = state.ui.viewMode === 'split' ? 4 : state.ui.viewMode === 'garment' ? 2 : 0;
  const selectionBoost = state.selectedSize === rec.size ? 8 : 2;
  const categoryBoost = productType(product) === 'full' ? 2 : productType(product) === 'bottom' ? -2 : 0;
  const score = clamp(base + fitModeBoost + photoBoost + modeBoost + selectionBoost + categoryBoost, 58, 97);

  return {
    value: score,
    label: score >= 90 ? 'High confidence preview' : score >= 80 ? 'Strong confidence preview' : score >= 70 ? 'Balanced preview confidence' : 'Early fit estimate'
  };
}

function stylingNotes(product) {
  const notes = [];
  const type = productType(product);

  if (type === 'top') {
    notes.push('Keep the hem close to the natural waist so the shoulders feel sharper and the drape looks cleaner.');
  } else if (type === 'layer') {
    notes.push('For light shells and hooded layers, settle the shoulder width first so the outer layer reads like it is sitting over your base look.');
  } else if (type === 'bottom') {
    notes.push('Match the waistband to your hip line first, then fine tune the leg fall with scale instead of drag alone.');
  } else if (type === 'dress') {
    notes.push('Anchor the neckline and shoulder width first, then use vertical shift to settle the length into place.');
  } else {
    notes.push('For full looks, align the chest area first and let the lower drape fall naturally before resizing again.');
  }

  if (state.ui.fitMode === 'fitted') {
    notes.push('Your fit mood is set to fitted, so a slightly higher placement usually reads more tailored on the body.');
  } else if (state.ui.fitMode === 'relaxed') {
    notes.push('Relaxed mode benefits from a touch more scale and a lower drape to preserve ease through the silhouette.');
  } else {
    notes.push('Balanced mode is best for judging overall proportion before committing to a tighter or looser final size.');
  }

  if (state.photoDataUrl) {
    notes.push(state.ui.viewMode === 'split'
      ? 'Use Split Compare to line up the shoulder seam and side line against the original photo before adding to bag.'
      : 'With a real photo loaded, Auto Fit gives a stronger starting position and the blend slider helps check edge alignment.');
  } else {
    notes.push('Upload a straight portrait photo next for a more believable preview and a higher confidence fit estimate.');
  }

  notes.push(Math.abs(state.ui.sceneOrbit) >= 10
    ? 'A light orbit helps you read drape and side balance, but keep it subtle when checking the final fit.'
    : 'Keep the 3D stage close to front view when you want the most accurate shoulder and center-line read.');

  if (state.photoDataUrl) {
    notes.push(state.pose.detected
      ? 'Body-aware fitting is active, so changing products now snaps the garment closer to your real shoulders and torso.'
      : 'Use a straight, front-facing photo with visible shoulders so the body-aware fitting can lock onto your shape.');
  }

  return notes.slice(0, 3);
}

function renderInsights(product) {
  const fit = fitScore(product);
  const notes = stylingNotes(product);
  const bar = document.getElementById('fit-meter-bar');
  const score = document.getElementById('fit-meter-score');
  const label = document.getElementById('fit-meter-label');
  const copy = document.getElementById('fit-meter-copy');
  const notesEl = document.getElementById('styling-notes');

  if (bar) bar.style.width = `${fit.value}%`;
  if (score) score.textContent = String(fit.value);
  if (label) label.textContent = fit.label;
  if (copy) {
    copy.textContent = state.photoDataUrl
      ? 'This estimate combines your current measurements, selected size, product type, and the active preview mode.'
      : 'This estimate is based on the mannequin stage and measurements only. A real photo will improve confidence.';
  }
  if (notesEl) {
    notesEl.innerHTML = notes
      .map(note => `<div class="rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-3 leading-7">${note}</div>`)
      .join('');
  }
}

function renderPhotoPanel() {
  const card = document.getElementById('photo-preview-card');
  const thumb = document.getElementById('photo-preview-thumb');
  const empty = document.getElementById('photo-preview-empty');
  if (!card || !thumb || !empty) return;

  card.classList.toggle('empty', !state.photoDataUrl);

  if (state.photoDataUrl) {
    thumb.src = state.photoDataUrl;
    thumb.classList.remove('hidden');
    empty.classList.add('hidden');
  } else {
    thumb.src = '';
    thumb.classList.add('hidden');
    empty.classList.remove('hidden');
  }
}

function renderFitCheckPanel(product) {
  const panel = document.getElementById('fit-check-panel');
  if (!panel || !product) return;

  panel.innerHTML = fitCheckItems(product)
    .map(item => `
      <div class="fit-check-item">
        <span class="fit-check-dot ${item.tone}"></span>
        <div>
          <strong>${item.title}</strong>
          <p>${item.copy}</p>
        </div>
      </div>
    `)
    .join('');
}

function renderAssetPanel(product) {
  const headline = document.getElementById('asset-panel-headline');
  const chip = document.getElementById('asset-origin-chip');
  const copy = document.getElementById('asset-status-copy');
  const previewImage = document.getElementById('asset-preview-image');
  const previewEmpty = document.getElementById('asset-preview-empty');
  const removeButton = document.getElementById('remove-asset-btn');
  const clearFitButton = document.getElementById('clear-fit-default-btn');
  if (!headline || !chip || !copy || !previewImage || !previewEmpty || !product) return;

  const customAsset = productCustomAsset(product);
  const resolvedAsset = resolvedOverlayAsset(product);
  const assetState = productAssetState(product);
  const sourceLabel = customAsset ? 'Browser Saved' : assetState === 'loaded' ? 'Project PNG' : 'PNG Needed';
  chip.className = `rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
    customAsset
      ? 'border border-emerald-700/20 bg-emerald-50 text-emerald-800'
      : assetState === 'loaded'
        ? 'border border-sky-700/20 bg-sky-50 text-sky-800'
        : 'border border-amber-700/20 bg-amber-50 text-amber-800'
  }`;

  headline.textContent = customAsset
    ? `This garment has its own saved transparent PNG and will use that exact cutout in the try-on stage.`
    : `Upload a transparent front-view PNG for ${product.name} to replace the fallback preview with the exact garment.`;
  chip.textContent = sourceLabel;
  copy.textContent = customAsset
    ? `${product.name} is using a browser-saved PNG asset${hasSavedPlacement(product) ? ' with saved fit tuning.' : '.'}`
    : assetState === 'loaded'
      ? `${product.name} is using a project PNG asset from the repo.`
      : `No exact PNG is saved for ${product.name} yet. Upload the isolated garment cutout, then use Auto Fit and Save Current Fit for this product.`;

  const showPreview = !!resolvedAsset && (assetState === 'loaded' || !!customAsset);
  previewImage.classList.toggle('hidden', !showPreview);
  previewEmpty.classList.toggle('hidden', showPreview);
  if (showPreview) {
    previewImage.src = resolvedAsset;
  } else {
    previewImage.src = '';
  }

  if (removeButton) {
    removeButton.disabled = !customAsset;
    removeButton.classList.toggle('opacity-50', !customAsset);
    removeButton.classList.toggle('cursor-not-allowed', !customAsset);
  }

  if (clearFitButton) {
    clearFitButton.disabled = !hasSavedPlacement(product);
    clearFitButton.classList.toggle('opacity-50', !hasSavedPlacement(product));
    clearFitButton.classList.toggle('cursor-not-allowed', !hasSavedPlacement(product));
  }
}

function renderAvatar() {
  const svg = document.getElementById('avatar-svg');
  if (!svg) return;

  const chest = state.measurements.chest / 36;
  const waist = state.measurements.waist / 32;
  const height = state.measurements.height / 66;
  const scale = bodyScale();
  const shoulder = 94 * chest * scale;
  const waistWidth = 70 * waist * scale;
  const hip = 92 * waist * scale;
  const torso = 180 * height;

  svg.innerHTML = `
    <defs>
      <linearGradient id="guideHead" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f1e2d7"/><stop offset="100%" stop-color="#d6b7a4"/></linearGradient>
      <linearGradient id="guideBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff" stop-opacity=".95"/><stop offset="100%" stop-color="#e8ddd0" stop-opacity=".9"/></linearGradient>
      <linearGradient id="guideShadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(17,17,17,.08)"/><stop offset="100%" stop-color="rgba(17,17,17,.02)"/></linearGradient>
    </defs>
    <ellipse cx="160" cy="492" rx="86" ry="16" fill="rgba(17,17,17,.08)"/>
    <circle cx="160" cy="72" r="33" fill="url(#guideHead)"/>
    <rect x="148" y="98" width="24" height="26" rx="12" fill="url(#guideHead)"/>
    <path d="M ${160 - shoulder / 2} 136 C ${160 - shoulder / 2 - 10} 205, ${160 - hip / 2} ${254 + torso * .18}, ${160 - waistWidth / 2} ${300 + torso * .18} L ${160 + waistWidth / 2} ${300 + torso * .18} C ${160 + hip / 2} ${254 + torso * .18}, ${160 + shoulder / 2 + 10} 205, ${160 + shoulder / 2} 136 Z" fill="url(#guideBody)" stroke="rgba(17,17,17,.06)" stroke-width="2"/>
    <path d="M ${160 - shoulder / 2 + 10} 148 C 94 212, 98 306, 108 360" fill="none" stroke="rgba(17,17,17,.05)" stroke-width="18" stroke-linecap="round"/>
    <path d="M ${160 + shoulder / 2 - 10} 148 C 226 212, 222 306, 212 360" fill="none" stroke="rgba(17,17,17,.05)" stroke-width="18" stroke-linecap="round"/>
    <path d="M 144 ${306 + torso * .16} C 140 390, 134 432, 128 480" fill="none" stroke="url(#guideHead)" stroke-width="22" stroke-linecap="round"/>
    <path d="M 176 ${306 + torso * .16} C 180 390, 186 432, 192 480" fill="none" stroke="url(#guideHead)" stroke-width="22" stroke-linecap="round"/>
    <path d="M 122 150 Q 160 136 198 150" fill="none" stroke="url(#guideShadow)" stroke-width="8" stroke-linecap="round"/>
  `;

  let opacity = state.photoDataUrl ? '0.18' : '1';
  if (state.ui.viewMode === 'garment') {
    opacity = state.photoDataUrl ? '0.08' : '0.62';
  }

  svg.style.opacity = state.ui.showAvatar ? opacity : '0';
}

function poseGarmentTemplate(product, colors) {
  if (!state.pose.detected || !state.pose.landmarks) return '';

  const type = productType(product);
  if (!['top', 'layer', 'dress', 'full'].includes(type)) return '';

  const metrics = photoLayoutMetrics();
  if (!metrics) return '';

  const landmarks = state.pose.landmarks;
  const leftShoulder = viewportPointToSvg(posePointToViewport(landmarks.leftShoulder, metrics), metrics);
  const rightShoulder = viewportPointToSvg(posePointToViewport(landmarks.rightShoulder, metrics), metrics);
  const leftHip = viewportPointToSvg(posePointToViewport(landmarks.leftHip, metrics), metrics);
  const rightHip = viewportPointToSvg(posePointToViewport(landmarks.rightHip, metrics), metrics);
  const leftElbow = viewportPointToSvg(posePointToViewport(landmarks.leftElbow, metrics), metrics);
  const rightElbow = viewportPointToSvg(posePointToViewport(landmarks.rightElbow, metrics), metrics);
  const leftWrist = viewportPointToSvg(posePointToViewport(landmarks.leftWrist, metrics), metrics);
  const rightWrist = viewportPointToSvg(posePointToViewport(landmarks.rightWrist, metrics), metrics);
  const nose = viewportPointToSvg(posePointToViewport(landmarks.nose, metrics), metrics);
  const shortSleeve = product.subcategory === 't-shirts';
  const jacketLayer = product.subcategory === 'jackets';
  const longlineTop = product.subcategory === 'tops';

  const shoulderSpan = Math.abs(rightShoulder.x - leftShoulder.x);
  const torsoHeight = Math.abs(((leftHip.y + rightHip.y) / 2) - ((leftShoulder.y + rightShoulder.y) / 2));
  const neckY = Math.min(leftShoulder.y, rightShoulder.y) - Math.max(8, shoulderSpan * 0.04);
  const leftNeck = { x: leftShoulder.x + (shoulderSpan * 0.16), y: neckY };
  const rightNeck = { x: rightShoulder.x - (shoulderSpan * 0.16), y: neckY };
  const leftUnderArm = blendPoint(leftShoulder, leftHip, 0.22);
  const rightUnderArm = blendPoint(rightShoulder, rightHip, 0.22);
  const leftWaist = blendPoint(leftShoulder, leftHip, 0.72);
  const rightWaist = blendPoint(rightShoulder, rightHip, 0.72);
  const hemDrop = type === 'full'
    ? torsoHeight * 1.3
    : type === 'dress'
      ? torsoHeight * 0.92
      : type === 'layer'
        ? torsoHeight * 0.34
        : longlineTop
          ? torsoHeight * 0.36
          : torsoHeight * 0.24;
  const leftHem = { x: leftHip.x - (shoulderSpan * (type === 'layer' ? 0.12 : 0.03)), y: leftHip.y + hemDrop };
  const rightHem = { x: rightHip.x + (shoulderSpan * (type === 'layer' ? 0.12 : 0.03)), y: rightHip.y + hemDrop };

  const leftForearm = shortSleeve
    ? blendPoint(leftShoulder, leftElbow, 0.72)
    : landmarks.leftWrist.visibility > 0.2
      ? blendPoint(leftElbow, leftWrist, 0.8)
      : { x: leftElbow.x - shoulderSpan * 0.08, y: leftElbow.y + torsoHeight * 0.18 };
  const rightForearm = shortSleeve
    ? blendPoint(rightShoulder, rightElbow, 0.72)
    : landmarks.rightWrist.visibility > 0.2
      ? blendPoint(rightElbow, rightWrist, 0.8)
      : { x: rightElbow.x + shoulderSpan * 0.08, y: rightElbow.y + torsoHeight * 0.18 };
  const sleeveInset = Math.max(8, shoulderSpan * 0.07);
  const leftCuffOuter = { x: leftForearm.x - sleeveInset, y: leftForearm.y + sleeveInset * 0.6 };
  const leftCuffInner = { x: leftForearm.x + sleeveInset * 0.32, y: leftForearm.y - sleeveInset * 0.1 };
  const rightCuffInner = { x: rightForearm.x - sleeveInset * 0.32, y: rightForearm.y - sleeveInset * 0.1 };
  const rightCuffOuter = { x: rightForearm.x + sleeveInset, y: rightForearm.y + sleeveInset * 0.6 };

  const shoulderLeftOuter = { x: leftShoulder.x - shoulderSpan * 0.08, y: leftShoulder.y + 3 };
  const shoulderRightOuter = { x: rightShoulder.x + shoulderSpan * 0.08, y: rightShoulder.y + 3 };
  const chestMidY = ((leftShoulder.y + rightShoulder.y) / 2) + torsoHeight * 0.14;
  const frontOpeningLeft = { x: ((leftNeck.x + rightNeck.x) / 2) - 3, y: chestMidY - 4 };
  const frontOpeningRight = { x: ((leftNeck.x + rightNeck.x) / 2) + 3, y: chestMidY - 4 };

  let bodyPath = `
    M ${shoulderLeftOuter.x} ${shoulderLeftOuter.y}
    C ${leftShoulder.x - shoulderSpan * 0.05} ${leftShoulder.y + torsoHeight * 0.08}, ${leftUnderArm.x - shoulderSpan * 0.06} ${leftUnderArm.y - 4}, ${leftUnderArm.x} ${leftUnderArm.y}
    C ${leftWaist.x - shoulderSpan * 0.04} ${leftWaist.y}, ${leftHem.x - shoulderSpan * 0.04} ${leftHem.y - torsoHeight * 0.12}, ${leftHem.x} ${leftHem.y}
    L ${rightHem.x} ${rightHem.y}
    C ${rightHem.x + shoulderSpan * 0.04} ${rightHem.y - torsoHeight * 0.12}, ${rightWaist.x + shoulderSpan * 0.04} ${rightWaist.y}, ${rightUnderArm.x} ${rightUnderArm.y}
    C ${rightUnderArm.x + shoulderSpan * 0.06} ${rightUnderArm.y - 4}, ${rightShoulder.x + shoulderSpan * 0.05} ${rightShoulder.y + torsoHeight * 0.08}, ${shoulderRightOuter.x} ${shoulderRightOuter.y}
    Q ${rightNeck.x + shoulderSpan * 0.03} ${neckY - shoulderSpan * 0.05} ${rightNeck.x} ${rightNeck.y}
    Q ${(nose.x || (leftNeck.x + rightNeck.x) / 2)} ${neckY - shoulderSpan * 0.03} ${leftNeck.x} ${leftNeck.y}
    Q ${leftNeck.x - shoulderSpan * 0.03} ${neckY - shoulderSpan * 0.05} ${shoulderLeftOuter.x} ${shoulderLeftOuter.y}
    Z
  `;

  let leftSleevePath = `
    M ${shoulderLeftOuter.x} ${shoulderLeftOuter.y}
    C ${leftElbow.x - shoulderSpan * 0.22} ${leftElbow.y - torsoHeight * 0.02}, ${leftCuffOuter.x - sleeveInset * 0.8} ${leftCuffOuter.y - 4}, ${leftCuffOuter.x} ${leftCuffOuter.y}
    L ${leftCuffInner.x} ${leftCuffInner.y}
    C ${leftElbow.x - shoulderSpan * 0.02} ${leftElbow.y - torsoHeight * 0.02}, ${leftUnderArm.x - shoulderSpan * 0.04} ${leftUnderArm.y + torsoHeight * 0.04}, ${leftUnderArm.x} ${leftUnderArm.y}
    Z
  `;

  let rightSleevePath = `
    M ${shoulderRightOuter.x} ${shoulderRightOuter.y}
    C ${rightElbow.x + shoulderSpan * 0.22} ${rightElbow.y - torsoHeight * 0.02}, ${rightCuffOuter.x + sleeveInset * 0.8} ${rightCuffOuter.y - 4}, ${rightCuffOuter.x} ${rightCuffOuter.y}
    L ${rightCuffInner.x} ${rightCuffInner.y}
    C ${rightElbow.x + shoulderSpan * 0.02} ${rightElbow.y - torsoHeight * 0.02}, ${rightUnderArm.x + shoulderSpan * 0.04} ${rightUnderArm.y + torsoHeight * 0.04}, ${rightUnderArm.x} ${rightUnderArm.y}
    Z
  `;

  if (type === 'layer') {
    return `
      <path d="${leftSleevePath}" fill="url(#fill)" opacity=".98"/>
      <path d="${rightSleevePath}" fill="url(#fill)" opacity=".98"/>
      <path d="${bodyPath}" fill="url(#fill)"/>
      <path d="M ${frontOpeningLeft.x} ${leftNeck.y + 6} L ${frontOpeningLeft.x} ${leftHem.y - 10}" stroke="rgba(255,255,255,.48)" stroke-width="3.8" stroke-linecap="round"/>
      <path d="M ${frontOpeningRight.x} ${rightNeck.y + 6} L ${frontOpeningRight.x} ${rightHem.y - 10}" stroke="${colors.shadow}" stroke-width="2.2" stroke-linecap="round" stroke-opacity=".34"/>
      <path d="M ${leftNeck.x + 8} ${leftNeck.y - 1} Q ${(nose.x || (leftNeck.x + rightNeck.x) / 2) - shoulderSpan * 0.16} ${neckY - shoulderSpan * 0.34} ${(nose.x || (leftNeck.x + rightNeck.x) / 2) - shoulderSpan * 0.04} ${neckY + 2}" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="11" stroke-linecap="round"/>
      <path d="M ${rightNeck.x - 8} ${rightNeck.y - 1} Q ${(nose.x || (leftNeck.x + rightNeck.x) / 2) + shoulderSpan * 0.16} ${neckY - shoulderSpan * 0.34} ${(nose.x || (leftNeck.x + rightNeck.x) / 2) + shoulderSpan * 0.04} ${neckY + 2}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="11" stroke-linecap="round"/>
      <path d="M ${leftNeck.x - 2} ${leftNeck.y + 2} Q ${(nose.x || (leftNeck.x + rightNeck.x) / 2) - shoulderSpan * 0.1} ${neckY - shoulderSpan * 0.18} ${(nose.x || (leftNeck.x + rightNeck.x) / 2)} ${neckY + 2}" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="8" stroke-linecap="round"/>
      <path d="M ${rightNeck.x + 2} ${rightNeck.y + 2} Q ${(nose.x || (leftNeck.x + rightNeck.x) / 2) + shoulderSpan * 0.1} ${neckY - shoulderSpan * 0.18} ${(nose.x || (leftNeck.x + rightNeck.x) / 2)} ${neckY + 2}" fill="none" stroke="rgba(255,255,255,.26)" stroke-width="8" stroke-linecap="round"/>
      <path d="M ${leftUnderArm.x + shoulderSpan * 0.1} ${chestMidY} Q ${(leftHem.x + rightHem.x) / 2} ${chestMidY + torsoHeight * 0.08} ${rightUnderArm.x - shoulderSpan * 0.1} ${chestMidY}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="10" stroke-linecap="round"/>
      <path d="M ${leftHem.x + shoulderSpan * 0.1} ${leftHem.y - 5} L ${rightHem.x - shoulderSpan * 0.1} ${rightHem.y - 5}" stroke="rgba(255,255,255,.24)" stroke-width="3.5" stroke-linecap="round"/>
    `;
  }

  return `
    <path d="${leftSleevePath}" fill="url(#fill)" opacity=".98"/>
    <path d="${rightSleevePath}" fill="url(#fill)" opacity=".98"/>
    <path d="${bodyPath}" fill="url(#fill)"/>
    <path d="M ${leftNeck.x + 2} ${leftNeck.y + 3} Q ${(nose.x || (leftNeck.x + rightNeck.x) / 2)} ${neckY - shoulderSpan * 0.06} ${rightNeck.x - 2} ${rightNeck.y + 3}" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="6" stroke-linecap="round"/>
    <path d="M ${(leftNeck.x + rightNeck.x) / 2} ${leftNeck.y + 12} L ${(leftHem.x + rightHem.x) / 2} ${Math.min(leftHem.y, rightHem.y) - 10}" stroke="${colors.accent}" stroke-width="2.2" stroke-linecap="round" stroke-opacity=".2"/>
    <path d="M ${leftHem.x + shoulderSpan * 0.08} ${leftHem.y - 5} L ${rightHem.x - shoulderSpan * 0.08} ${rightHem.y - 5}" stroke="rgba(255,255,255,.22)" stroke-width="3.5" stroke-linecap="round"/>
  `;
}

function garmentSvg(product) {
  const colors = palette(product.color);
  const type = productType(product);
  const chest = state.measurements.chest / 36;
  const waist = state.measurements.waist / 32;
  const height = state.measurements.height / 66;
  const scale = bodyScale() * fitModeScale();
  const shoulder = 98 * chest * scale;
  const waistWidth = 72 * waist * scale;
  const hip = 96 * waist * scale;
  const hem = type === 'full' ? 170 * scale : type === 'dress' ? 138 * scale : 92 * scale;
  const length = type === 'full' ? 300 * height : type === 'dress' ? 230 * height : 160 * height;
  const bottom = type === 'bottom' ? 215 * height : 0;
  const c = 160;
  const top = type === 'bottom' ? 236 : 130;

  let shapes = `
    <defs>
      <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${colors.fill}"/><stop offset="100%" stop-color="${colors.shadow}"/></linearGradient>
      <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="rgba(255,255,255,.42)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></linearGradient>
    </defs>
  `;

  const poseTemplate = poseGarmentTemplate(product, colors);
  if (poseTemplate) {
    shapes += poseTemplate;
    shapes += `
      <path d="M 110 102 Q 160 60 210 102" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="7"/>
      <path d="M 112 110 Q 160 82 208 110" fill="none" stroke="url(#shine)" stroke-width="10" stroke-linecap="round"/>
    `;
    return shapes;
  }

  if (type === 'top') {
    shapes += `
      <path d="M ${c - shoulder / 2} ${top + 6} C ${c - shoulder / 2 - 12} ${top + 42}, ${c - waistWidth / 2 - 8} ${top + 100}, ${c - waistWidth / 2} ${top + length} L ${c + waistWidth / 2} ${top + length} C ${c + waistWidth / 2 + 8} ${top + 100}, ${c + shoulder / 2 + 12} ${top + 42}, ${c + shoulder / 2} ${top + 6} L ${c + shoulder / 2 - 18} ${top - 18} Q ${c} ${top - 2} ${c - shoulder / 2 + 18} ${top - 18} Z" fill="url(#fill)"/>
      <path d="M ${c - shoulder / 2 + 8} ${top + 20} C ${c - shoulder / 2 - 24} ${top + 76}, ${c - shoulder / 2 - 26} ${top + 138}, ${c - shoulder / 2 + 4} ${top + 196}" fill="none" stroke="${colors.shadow}" stroke-width="18" stroke-linecap="round" stroke-opacity=".88"/>
      <path d="M ${c + shoulder / 2 - 8} ${top + 20} C ${c + shoulder / 2 + 24} ${top + 76}, ${c + shoulder / 2 + 26} ${top + 138}, ${c + shoulder / 2 - 4} ${top + 196}" fill="none" stroke="${colors.shadow}" stroke-width="18" stroke-linecap="round" stroke-opacity=".88"/>
      <path d="M ${c - 10} ${top + 30} L ${c - 4} ${top + length - 16}" stroke="${colors.accent}" stroke-width="3" stroke-linecap="round" stroke-opacity=".24"/>
      <path d="M ${c - shoulder / 2 + 16} ${top + 18} Q ${c} ${top + 2} ${c + shoulder / 2 - 16} ${top + 18}" fill="none" stroke="rgba(255,255,255,.34)" stroke-width="6" stroke-linecap="round"/>
      <path d="M ${c - waistWidth / 2 + 10} ${top + length - 10} L ${c + waistWidth / 2 - 10} ${top + length - 10}" stroke="rgba(255,255,255,.34)" stroke-width="4" stroke-linecap="round"/>
    `;
  }

  if (type === 'layer') {
    shapes += `
      <path d="M ${c - shoulder / 2 - 6} ${top + 4} C ${c - shoulder / 2 - 20} ${top + 40}, ${c - waistWidth / 2 - 18} ${top + 110}, ${c - waistWidth / 2 - 8} ${top + length} L ${c + waistWidth / 2 + 8} ${top + length} C ${c + waistWidth / 2 + 18} ${top + 110}, ${c + shoulder / 2 + 20} ${top + 40}, ${c + shoulder / 2 + 6} ${top + 4} L ${c + shoulder / 2 - 10} ${top - 18} Q ${c + 26} ${top - 26} ${c + 2} ${top + 8} L ${c - 2} ${top + 8} Q ${c - 26} ${top - 26} ${c - shoulder / 2 + 10} ${top - 18} Z" fill="url(#fill)"/>
      <path d="M ${c - 2} ${top + 10} L ${c - 2} ${top + length - 16}" stroke="rgba(255,255,255,.46)" stroke-width="4" stroke-linecap="round"/>
      <path d="M ${c - shoulder / 2 + 2} ${top + 28} C ${c - shoulder / 2 - 34} ${top + 88}, ${c - shoulder / 2 - 32} ${top + 152}, ${c - shoulder / 2 + 4} ${top + 212}" fill="none" stroke="${colors.shadow}" stroke-width="22" stroke-linecap="round" stroke-opacity=".92"/>
      <path d="M ${c + shoulder / 2 - 2} ${top + 28} C ${c + shoulder / 2 + 34} ${top + 88}, ${c + shoulder / 2 + 32} ${top + 152}, ${c + shoulder / 2 - 4} ${top + 212}" fill="none" stroke="${colors.shadow}" stroke-width="22" stroke-linecap="round" stroke-opacity=".92"/>
      <path d="M ${c - 54} ${top + 108} Q ${c - 74} ${top + 132} ${c - 46} ${top + 148}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="5" stroke-linecap="round"/>
      <path d="M ${c + 54} ${top + 108} Q ${c + 74} ${top + 132} ${c + 46} ${top + 148}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="5" stroke-linecap="round"/>
      <path d="M ${c - 30} ${top - 8} Q ${c} ${top - 42} ${c + 30} ${top - 8}" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="10" stroke-linecap="round"/>
      <path d="M ${c - shoulder / 2 + 20} ${top + length - 12} L ${c + shoulder / 2 - 20} ${top + length - 12}" stroke="rgba(255,255,255,.28)" stroke-width="4" stroke-linecap="round"/>
    `;
  }

  if (type === 'bottom') {
    shapes += `
      <rect x="${c - hip / 2}" y="${top - 18}" width="${hip}" height="30" rx="14" fill="${colors.shadow}"/>
      <path d="M ${c - hip / 2} ${top} Q ${c - 16} ${top + 26} ${c - 12} ${top + 56} L ${c - 18} ${top + bottom} L ${c - 50} ${top + bottom} L ${c - 72} ${top + 54} Q ${c - hip / 2 + 6} ${top + 16} ${c - hip / 2} ${top} Z" fill="url(#fill)"/>
      <path d="M ${c + hip / 2} ${top} Q ${c + 16} ${top + 26} ${c + 12} ${top + 56} L ${c + 18} ${top + bottom} L ${c + 50} ${top + bottom} L ${c + 72} ${top + 54} Q ${c + hip / 2 - 6} ${top + 16} ${c + hip / 2} ${top} Z" fill="url(#fill)"/>
      <path d="M ${c} ${top + 20} L ${c} ${top + bottom - 12}" stroke="${colors.accent}" stroke-width="3" stroke-linecap="round" stroke-opacity=".24"/>
      <path d="M ${c - hip / 2 + 12} ${top + 6} L ${c + hip / 2 - 12} ${top + 6}" stroke="rgba(255,255,255,.28)" stroke-width="4" stroke-linecap="round"/>
    `;
  }

  if (type === 'dress' || type === 'full') {
    shapes += `
      <path d="M ${c - shoulder / 2} ${top + 4} C ${c - shoulder / 2 - 16} ${top + 46}, ${c - hem / 2} ${top + 140}, ${c - hem / 2 + 10} ${top + length} L ${c + hem / 2 - 10} ${top + length} C ${c + hem / 2} ${top + 140}, ${c + shoulder / 2 + 16} ${top + 46}, ${c + shoulder / 2} ${top + 4} L ${c + shoulder / 2 - 18} ${top - 16} Q ${c} ${top - 2} ${c - shoulder / 2 + 18} ${top - 16} Z" fill="url(#fill)"/>
      <path d="M ${c - shoulder / 2 + 10} ${top + 18} C ${c - shoulder / 2 - 30} ${top + 80}, ${c - shoulder / 2 - 28} ${top + 150}, ${c - shoulder / 2 + 2} ${top + 210}" fill="none" stroke="${colors.shadow}" stroke-width="18" stroke-linecap="round" stroke-opacity=".88"/>
      <path d="M ${c + shoulder / 2 - 10} ${top + 18} C ${c + shoulder / 2 + 30} ${top + 80}, ${c + shoulder / 2 + 28} ${top + 150}, ${c + shoulder / 2 - 2} ${top + 210}" fill="none" stroke="${colors.shadow}" stroke-width="18" stroke-linecap="round" stroke-opacity=".88"/>
      <path d="M ${c} ${top + 32} L ${c} ${top + length - 28}" stroke="${colors.accent}" stroke-width="4" stroke-linecap="round" stroke-opacity=".28"/>
      <path d="M ${c - shoulder / 2 + 16} ${top + 16} Q ${c} ${top} ${c + shoulder / 2 - 16} ${top + 16}" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="6" stroke-linecap="round"/>
      <path d="M ${c - hem / 2 + 20} ${top + length - 10} L ${c + hem / 2 - 20} ${top + length - 10}" stroke="rgba(255,255,255,.3)" stroke-width="4" stroke-linecap="round"/>
    `;

    if (type === 'full') {
      shapes += `
        <path d="M ${c - 68} ${top + 174} Q ${c - 4} ${top + 138} ${c + 84} ${top + 108}" fill="none" stroke="${colors.accent}" stroke-width="12" stroke-linecap="round" stroke-opacity=".18"/>
        <path d="M ${c - 28} ${top + length - 16} C ${c - 32} ${top + length + 40}, ${c - 38} ${top + length + 80}, ${c - 40} ${top + length + 122}" fill="none" stroke="${colors.shadow}" stroke-width="22" stroke-linecap="round"/>
        <path d="M ${c + 28} ${top + length - 16} C ${c + 32} ${top + length + 40}, ${c + 38} ${top + length + 80}, ${c + 40} ${top + length + 122}" fill="none" stroke="${colors.shadow}" stroke-width="22" stroke-linecap="round"/>
      `;
    }
  }

  shapes += `
    <path d="M 110 102 Q 160 60 210 102" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="9"/>
    <path d="M 112 110 Q 160 82 208 110" fill="none" stroke="url(#shine)" stroke-width="12" stroke-linecap="round"/>
  `;
  return shapes;
}

function exactAssetClipPath(product) {
  const type = productType(product);
  if (!state.photoDataUrl) return 'none';

  const genericShape = {
    top: 'polygon(15% 5%, 34% 4%, 42% 10%, 58% 10%, 66% 4%, 85% 5%, 92% 32%, 88% 96%, 12% 96%, 8% 32%)',
    layer: 'polygon(12% 4%, 34% 3%, 43% 9%, 57% 9%, 66% 3%, 88% 4%, 94% 34%, 89% 98%, 11% 98%, 6% 34%)',
    dress: 'polygon(14% 5%, 34% 4%, 42% 10%, 58% 10%, 66% 4%, 86% 5%, 93% 26%, 96% 96%, 4% 96%, 7% 26%)',
    full: 'polygon(14% 5%, 34% 4%, 42% 10%, 58% 10%, 66% 4%, 86% 5%, 93% 24%, 97% 98%, 3% 98%, 7% 24%)',
    bottom: 'polygon(22% 12%, 78% 12%, 88% 96%, 12% 96%)'
  };

  if (!state.pose.detected || !state.pose.landmarks) {
    return genericShape[type] || 'none';
  }

  const metrics = photoLayoutMetrics();
  if (!metrics) return genericShape[type] || 'none';

  const leftShoulder = posePointToViewport(state.pose.landmarks.leftShoulder, metrics);
  const rightShoulder = posePointToViewport(state.pose.landmarks.rightShoulder, metrics);
  const leftHip = posePointToViewport(state.pose.landmarks.leftHip, metrics);
  const rightHip = posePointToViewport(state.pose.landmarks.rightHip, metrics);
  const shoulderSpan = Math.abs(rightShoulder.x - leftShoulder.x);
  const shoulderTop = Math.min(leftShoulder.y, rightShoulder.y);
  const hipsMidY = (leftHip.y + rightHip.y) / 2;
  const typeBottom = type === 'full'
    ? Math.min(metrics.viewportHeight - 18, hipsMidY + shoulderSpan * 2.2)
    : type === 'dress'
      ? Math.min(metrics.viewportHeight - 28, hipsMidY + shoulderSpan * 1.55)
      : type === 'layer'
        ? Math.min(metrics.viewportHeight - 36, hipsMidY + shoulderSpan * 0.78)
        : type === 'bottom'
          ? Math.min(metrics.viewportHeight - 18, hipsMidY + shoulderSpan * 1.9)
          : Math.min(metrics.viewportHeight - 48, hipsMidY + shoulderSpan * 0.55);

  const left = clamp(((Math.min(leftShoulder.x, leftHip.x) - shoulderSpan * 0.32) / metrics.viewportWidth) * 100, 4, 32);
  const right = clamp(((Math.max(rightShoulder.x, rightHip.x) + shoulderSpan * 0.32) / metrics.viewportWidth) * 100, 68, 96);
  const neckLeft = clamp((((leftShoulder.x + shoulderSpan * 0.12) / metrics.viewportWidth) * 100), left + 6, 45);
  const neckRight = clamp((((rightShoulder.x - shoulderSpan * 0.12) / metrics.viewportWidth) * 100), 55, right - 6);
  const top = clamp((((shoulderTop - shoulderSpan * 0.18) / metrics.viewportHeight) * 100), 3, 20);
  const underArm = clamp((((shoulderTop + shoulderSpan * 0.52) / metrics.viewportHeight) * 100), top + 12, 48);
  const waist = clamp((((hipsMidY + shoulderSpan * 0.16) / metrics.viewportHeight) * 100), underArm + 10, 76);
  const bottom = clamp(((typeBottom / metrics.viewportHeight) * 100), waist + 12, 98);

  if (type === 'bottom') {
    return `polygon(${left + 8}% ${top + 8}%, ${right - 8}% ${top + 8}%, ${right}% ${bottom}%, ${left}% ${bottom}%)`;
  }

  return `polygon(${left}% ${top + 2}%, ${neckLeft}% ${top}%, 50% ${top + 7}%, ${neckRight}% ${top}%, ${right}% ${top + 2}%, ${right + 2}% ${underArm}%, ${right - 1}% ${waist}%, ${right}% ${bottom}%, ${left}% ${bottom}%, ${left + 1}% ${waist}%, ${left - 2}% ${underArm}%)`;
}

function exactAssetVisualProfile(product) {
  const type = productType(product);
  const useClarity = state.ui.fitClarity && state.photoDataUrl;

  return {
    clipPath: useClarity ? exactAssetClipPath(product) : 'none',
    filter: type === 'layer'
      ? 'drop-shadow(0 18px 24px rgba(17,17,17,.18)) contrast(1.04) saturate(1.03)'
      : type === 'dress' || type === 'full'
        ? 'drop-shadow(0 16px 22px rgba(17,17,17,.16)) contrast(1.03) saturate(1.02)'
        : 'drop-shadow(0 14px 18px rgba(17,17,17,.14)) contrast(1.03) saturate(1.02)',
    opacity: useClarity ? '0.98' : '1'
  };
}

function renderGarment() {
  const svg = document.getElementById('garment-svg');
  const image = document.getElementById('garment-image');
  const wrapper = document.getElementById('garment-wrapper');
  const product = selectedProduct();
  const shadow = document.getElementById('product-shadow');
  const divider = document.getElementById('split-divider');
  if (!svg || !image || !wrapper || !product) return;

  if (image.dataset.bound !== 'true') {
    image.addEventListener('load', () => {
      const productId = Number(image.dataset.productId || 0);
      if (productId) {
        garmentAssetState[productId] = 'loaded';
        updateTryOn();
      }
    });

    image.addEventListener('error', () => {
      const productId = Number(image.dataset.productId || 0);
      if (productId) {
        garmentAssetState[productId] = 'missing';
        image.classList.add('hidden');
        updateTryOn();
      }
    });

    image.dataset.bound = 'true';
  }

  const asset = resolvedOverlayAsset(product);
  const assetState = productAssetState(product);

  if (asset && image.dataset.asset !== asset && assetState !== 'missing') {
    garmentAssetState[product.id] = 'pending';
    image.dataset.productId = String(product.id);
    image.dataset.asset = asset;
    image.src = asset;
  }

  const useExactAsset = !!asset && productAssetState(product) === 'loaded';

  if (useExactAsset) {
    const profile = exactAssetVisualProfile(product);
    image.classList.remove('hidden');
    image.classList.add('exact');
    image.style.clipPath = profile.clipPath;
    image.style.filter = profile.filter;
    image.style.opacity = profile.opacity;
    svg.classList.add('hidden');
    svg.innerHTML = '';
  } else {
    image.classList.add('hidden');
    image.classList.remove('exact');
    image.style.clipPath = 'none';
    image.style.filter = '';
    image.style.opacity = '1';
    svg.classList.remove('hidden');
    svg.innerHTML = garmentSvg(product);
  }

  const clarityFactor = useExactAsset && state.ui.fitClarity ? 0.28 : 0.55;
  const orbitTwist = clamp(state.ui.sceneOrbit * clarityFactor, -18, 18);
  const depthTilt = useExactAsset && state.ui.fitClarity
    ? clamp(2 + (state.ui.sceneDepth * 0.04), 2, 5)
    : clamp(4 + (state.ui.sceneDepth * 0.1), 4, 10);
  const garmentDepth = useExactAsset && state.ui.fitClarity
    ? Math.max(8, state.ui.sceneDepth * 0.38)
    : state.ui.sceneDepth + (state.ui.viewMode === 'garment' ? 10 : 0);
  wrapper.style.transform = `translate3d(${state.overlay.x}px, ${state.overlay.y}px, ${garmentDepth}px) scale(${state.overlay.scale / 100}) rotateX(${depthTilt}deg) rotateY(${orbitTwist}deg) rotate(${state.overlay.rotate}deg)`;
  wrapper.style.opacity = (state.overlay.opacity / 100) * (state.ui.compare / 100);
  wrapper.style.mixBlendMode = state.photoDataUrl && state.ui.viewMode === 'overlay'
    ? useExactAsset ? 'normal' : state.pose.detected ? 'darken' : 'multiply'
    : 'normal';
  wrapper.style.filter = state.ui.viewMode === 'garment'
    ? 'drop-shadow(0 28px 28px rgba(17,17,17,.24)) saturate(1.04)'
    : useExactAsset && state.ui.fitClarity
      ? 'drop-shadow(0 12px 18px rgba(17,17,17,.14)) contrast(1.05) saturate(1.03)'
      : state.pose.detected
      ? 'drop-shadow(0 18px 20px rgba(17,17,17,.16)) saturate(1.02) contrast(1.01)'
      : 'drop-shadow(0 22px 22px rgba(17,17,17,.18)) saturate(1.02)';
  wrapper.style.clipPath = state.ui.viewMode === 'split'
    ? `polygon(${state.ui.split}% 0, 100% 0, 100% 100%, ${state.ui.split}% 100%)`
    : 'none';

  if (shadow) {
    const width = productType(product) === 'bottom' ? 34 : productType(product) === 'top' ? 38 : productType(product) === 'layer' ? 44 : 48;
    const height = productType(product) === 'full' ? 11 : 9;
    shadow.style.width = `${width}%`;
    shadow.style.height = `${height}%`;
    shadow.style.transform = `translateX(calc(-50% + ${state.overlay.x * 0.3}px)) translateZ(${-Math.max(6, state.ui.sceneDepth * 0.35)}px) scale(${Math.max(0.78, state.overlay.scale / 118)})`;
    shadow.style.opacity = state.ui.viewMode === 'garment' ? '0.34' : '0.24';
  }

  if (divider) {
    divider.classList.toggle('hidden', state.ui.viewMode !== 'split');
    divider.style.left = `${state.ui.split}%`;
  }
}

function renderScene3D() {
  const scene = document.getElementById('viewport-scene');
  const photo = document.getElementById('uploaded-photo');
  const avatar = document.getElementById('avatar-svg');
  const guides = document.getElementById('alignment-guides');
  const placeholder = document.getElementById('photo-placeholder');

  if (!scene) return;

  const orbit = state.ui.sceneOrbit;
  const depth = state.ui.sceneDepth;
  const lift = state.ui.sceneLift;
  const exactAssetActive = productAssetState(selectedProduct()) === 'loaded';
  const tilt = exactAssetActive && state.ui.fitClarity
    ? clamp(4 + (depth * 0.05), 4, 7)
    : clamp(8 + (depth * 0.12), 7, 14);
  const zoom = exactAssetActive && state.ui.fitClarity ? 1 + (depth / 420) : 1 + (depth / 260);
  const orbitFactor = exactAssetActive && state.ui.fitClarity ? 0.42 : 1;

  scene.style.transform = `translateY(${lift}px) rotateX(${tilt}deg) rotateY(${orbit * orbitFactor}deg) scale(${zoom})`;
  scene.style.filter = `saturate(${(1 + depth / 220).toFixed(2)})`;

  if (photo) {
    const mirror = state.ui.mirrorPhoto ? 'scaleX(-1) ' : '';
    photo.style.transform = `${mirror}translateZ(${-depth}px) scale(${(1 + depth / 240).toFixed(3)})`;
    photo.style.filter = state.ui.viewMode === 'garment'
      ? 'contrast(1.02) saturate(.82) blur(.4px)'
      : state.ui.fitClarity
        ? 'contrast(1.01) saturate(.84) brightness(.98)'
      : 'contrast(1.03) saturate(.96)';
  }

  if (placeholder) {
    placeholder.style.transform = `translateZ(${-Math.max(10, depth * 0.55)}px)`;
  }

  if (avatar) {
    avatar.style.transform = `translateZ(${-Math.round(depth * 0.25)}px) scale(${(1 + depth / 420).toFixed(3)})`;
    avatar.style.filter = 'drop-shadow(0 24px 30px rgba(17,17,17,.06))';
  }

  if (guides) {
    guides.style.transform = `translateZ(${depth + 18}px)`;
  }
}

function recommendSize(product) {
  const { chest, waist, bodyType } = state.measurements;
  let score = (chest - 28) * 0.65 + (waist - 24) * 0.45;

  if (productType(product) === 'full') score += 1.2;
  if (bodyType === 'slim') score -= 1;
  if (bodyType === 'curvy') score += 1.4;
  if (state.ui.fitMode === 'fitted') score -= 1.2;
  if (state.ui.fitMode === 'relaxed') score += 1.6;

  let size = 'XS';
  let label = 'Tailored fit';
  if (score > 23) { size = 'XL'; label = 'Relaxed fit'; }
  else if (score > 18) { size = 'L'; label = 'Comfort fit'; }
  else if (score > 12) { size = 'M'; label = 'Balanced fit'; }
  else if (score > 7) { size = 'S'; label = 'Close fit'; }

  if (!product.sizes.includes(size)) {
    size = product.sizes[product.sizes.length - 1] || product.sizes[0] || 'M';
  }

  return { size, label };
}

function sizeNumericValue(size) {
  return ['XS', 'S', 'M', 'L', 'XL', 'XXL'].indexOf(size);
}

function sizeDistanceFromIdeal(product, size) {
  const rec = recommendSize(product);
  const ideal = sizeNumericValue(rec.size);
  const current = sizeNumericValue(size);
  const distance = ideal >= 0 && current >= 0 ? Math.abs(current - ideal) : 0;
  const fitBias = state.ui.fitMode === 'fitted' ? -0.18 : state.ui.fitMode === 'relaxed' ? 0.18 : 0;

  return distance + fitBias;
}

function sizeBodyRead(product, size) {
  const diff = sizeDistanceFromIdeal(product, size);
  if (diff <= 0.15) {
    return {
      title: `${size} looks best on body`,
      tone: 'good',
      copy: 'This size should keep the shoulder and waist shape clean without adding extra drag or tightness.'
    };
  }

  if (diff <= 0.85) {
    return {
      title: `${size} is a possible second option`,
      tone: 'soft',
      copy: diff > 0
        ? 'This should still work, but the body line may read a little closer or a little softer than the best-fit option.'
        : 'This can still work, but it may feel a touch sharper on the body than the best balanced size.'
    };
  }

  return {
    title: `${size} is less ideal on body`,
    tone: 'warn',
    copy: 'This size is more likely to look too close or too loose through the body compared with the stronger fit option.'
  };
}

function renderSizeClarity(product) {
  const rec = recommendSize(product);
  const headline = document.getElementById('size-clarity-headline');
  const grid = document.getElementById('size-clarity-grid');
  if (!headline || !grid) return;

  const sorted = [...product.sizes].sort((a, b) => sizeDistanceFromIdeal(product, a) - sizeDistanceFromIdeal(product, b));
  const topSizes = sorted.slice(0, Math.min(2, sorted.length));
  const selectedRead = sizeBodyRead(product, state.selectedSize || rec.size);

  headline.textContent = `${rec.size} is the strongest fit estimate for your body. ${state.selectedSize === rec.size ? 'Your current selected size matches that.' : `${state.selectedSize || rec.size} is selected right now.`}`;

  grid.innerHTML = topSizes.map(size => {
    const read = sizeBodyRead(product, size);
    const active = size === state.selectedSize;
    const toneClasses = read.tone === 'good'
      ? 'border-emerald-700/20 bg-emerald-50'
      : read.tone === 'warn'
        ? 'border-amber-700/20 bg-amber-50'
        : 'border-black/10 bg-black/[0.03]';

    return `
      <div class="rounded-[18px] border ${toneClasses} px-4 py-4">
        <div class="flex items-center justify-between gap-3">
          <p class="serif text-2xl font-bold">${size}</p>
          <span class="rounded-full ${active ? 'bg-black text-white' : 'bg-white text-black/60'} px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">${active ? 'Selected' : 'Preview'}</span>
        </div>
        <p class="mt-2 text-sm font-semibold text-black/75">${read.title}</p>
        <p class="mt-2 text-sm leading-6 text-black/58">${read.copy}</p>
      </div>
    `;
  }).join('');

  if (!topSizes.includes(state.selectedSize)) {
    grid.innerHTML += `
      <div class="rounded-[18px] border border-amber-700/20 bg-amber-50 px-4 py-4 sm:col-span-2">
        <p class="text-sm font-semibold text-black/75">${selectedRead.title}</p>
        <p class="mt-2 text-sm leading-6 text-black/58">${selectedRead.copy}</p>
      </div>
    `;
  }
}

function renderSummary() {
  const product = selectedProduct();
  const summary = document.getElementById('selected-product-summary');
  const rec = recommendSize(product);
  const assetState = productAssetState(product);
  const customAsset = !!productCustomAsset(product);
  const assetChip = assetState === 'loaded'
    ? `<span class="rounded-full border border-emerald-700/20 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">${customAsset ? 'Browser PNG' : 'PNG Ready'}</span>`
    : assetState === 'missing'
      ? '<span class="rounded-full border border-amber-700/20 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">PNG Needed</span>'
      : '<span class="rounded-full border border-sky-700/20 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-800">PNG Loading</span>';

  state.selectedSize = state.selectedSize && product.sizes.includes(state.selectedSize) ? state.selectedSize : rec.size;
  document.getElementById('recommended-size').textContent = state.selectedSize;
  document.getElementById('fit-confidence').textContent = rec.label;
  document.getElementById('fit-explainer').textContent = `For ${product.name}, your ${state.measurements.chest}" chest and ${state.measurements.waist}" waist suggest ${rec.size} as the best body fit, with ${state.selectedSize} currently selected for preview.`;

  summary.innerHTML = `
    <div class="grid gap-5 sm:grid-cols-[124px_minmax(0,1fr)]">
      <div class="summary-image overflow-hidden rounded-[22px] border border-black/8 shadow-[0_14px_34px_rgba(17,17,17,.06)]"><img src="${product.image}" alt="${product.name}"></div>
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-xs uppercase tracking-[0.22em] text-black/40">${productTypeLabel(product)} / ${product.line}</p>
          <span class="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/65">${product.color}</span>
          <span class="rounded-full bg-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">$${product.price}</span>
          ${assetChip}
        </div>
        <h3 class="mt-3 text-[1.65rem] font-semibold leading-tight">${product.name}</h3>
        <p class="mt-2 text-sm text-black/55">${productStructureLabel(product)}</p>
        <div class="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-black/45">
          <span class="rounded-full border border-black/10 bg-black/[0.03] px-3 py-2">${product.supportLevel}</span>
          <span class="rounded-full border border-black/10 bg-black/[0.03] px-3 py-2">${product.activity}</span>
        </div>
        <p class="mt-4 text-sm leading-7 text-black/60">${product.description}</p>
        <p class="mt-3 rounded-[18px] border border-black/10 bg-black/[0.03] px-4 py-3 text-sm leading-7 text-black/62">${productAssetMessage(product)}</p>
      </div>
    </div>
    <div class="soft-rule my-5"></div>
    <div class="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-black/45">${product.features.slice(0, 3).map(feature => `<span class="rounded-full border border-black/10 bg-black/[0.03] px-3 py-2">${feature}</span>`).join('')}</div>
    <div class="flex flex-wrap gap-2 pt-4">
      <a href="product.html?productId=${product.id}" class="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-black hover:text-white">View Details</a>
      <a href="collections.html" class="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-black hover:text-white">More Products</a>
      <button type="button" onclick="autoFitOverlay()" class="rounded-full border border-black/10 bg-[rgba(143,95,74,.06)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-black hover:text-white">Auto Fit</button>
    </div>
  `;

  renderInsights(product);
  renderSizeClarity(product);
  renderAssetPanel(product);
}

function renderSizes() {
  const product = selectedProduct();
  const el = document.getElementById('size-comparison');
  el.innerHTML = '';

  product.sizes.forEach(size => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `size-btn rounded-2xl px-3 py-3 text-sm font-semibold ${size === state.selectedSize ? 'active' : ''}`;
    btn.textContent = size;
    btn.addEventListener('click', () => {
      state.selectedSize = size;
      updateTryOn();
    });
    el.appendChild(btn);
  });
}

function renderProducts() {
  const grid = document.getElementById('try-on-product-grid');
  grid.innerHTML = '';

  const searchTerm = state.ui.tryOnSearch.trim().toLowerCase();
  const visibleProducts = tryOnProducts().filter(product => {
    const matchesCategory = tryOnCategoryMatches(product);
    const matchesSearch = !searchTerm ||
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.color.toLowerCase().includes(searchTerm) ||
      product.line.toLowerCase().includes(searchTerm) ||
      product.activity.toLowerCase().includes(searchTerm) ||
      product.fitProfile.toLowerCase().includes(searchTerm) ||
      product.silhouette.toLowerCase().includes(searchTerm) ||
      productTypeLabel(product).toLowerCase().includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  if (!visibleProducts.length) {
    grid.innerHTML = '<div class="rounded-[24px] border border-dashed border-black/15 bg-white/60 p-8 text-center text-sm text-black/55 md:col-span-2 xl:col-span-3">No try-on products match your current search or category.</div>';
    return;
  }

  visibleProducts.forEach(product => {
    const assetState = productAssetState(product);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `product-card rounded-[26px] border border-black/10 bg-white/78 p-4 text-left shadow-[0_16px_34px_rgba(17,17,17,.05)] ${product.id === state.selectedProductId ? 'active' : ''}`;
    card.innerHTML = `
      <div class="overflow-hidden rounded-[20px] border border-black/8 bg-[#f5efe8]">
        <img src="${product.image}" alt="${product.name}" class="h-60 w-full object-cover">
      </div>
      <div class="mt-4 flex items-start justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-xs uppercase tracking-[0.22em] text-black/40">${productTypeLabel(product)} / ${product.line}</p>
            ${product.badge ? `<span class="rounded-full border border-black/10 bg-black/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/55">${product.badge}</span>` : ''}
          </div>
          <h3 class="mt-2 text-lg font-semibold leading-snug">${product.name}</h3>
          <p class="mt-1 text-sm text-black/55">${productStructureLabel(product)}</p>
          <div class="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-black/45">
            <span class="rounded-full border border-black/10 bg-white px-3 py-1.5">${product.color}</span>
            <span class="rounded-full border border-black/10 bg-white px-3 py-1.5">${product.supportLevel}</span>
            <span class="rounded-full border ${assetState === 'loaded' ? 'border-emerald-700/20 bg-emerald-50 text-emerald-800' : 'border-black/10 bg-white text-black/55'} px-3 py-1.5">${assetState === 'loaded' ? 'Exact PNG' : 'Preview Shape'}</span>
          </div>
        </div>
        <span class="rounded-full bg-black px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">$${product.price}</span>
      </div>
      <div class="soft-rule my-4"></div>
      <p class="text-sm leading-6 text-black/58">${product.description.slice(0, 92)}${product.description.length > 92 ? '...' : ''}</p>
    `;
    card.addEventListener('click', () => {
      selectProductForTryOn(product.id);
    });
    grid.appendChild(card);
  });
}

function updateDisplays() {
  const text = {
    'chest-display': `${state.measurements.chest}"`,
    'waist-display': `${state.measurements.waist}"`,
    'height-display': `${state.measurements.height}"`,
    'overlay-scale-display': `${state.overlay.scale}%`,
    'overlay-x-display': `${state.overlay.x}`,
    'overlay-y-display': `${state.overlay.y}`,
    'overlay-rotate-display': `${state.overlay.rotate}deg`,
    'overlay-opacity-display': `${state.overlay.opacity}%`,
    'compare-display': `${state.ui.compare}%`,
    'split-display': `${state.ui.split}%`,
    'scene-orbit-display': `${state.ui.sceneOrbit > 0 ? '+' : ''}${state.ui.sceneOrbit}deg`,
    'scene-depth-display': `${state.ui.sceneDepth}px`,
    'scene-lift-display': `${state.ui.sceneLift}px`
  };

  Object.entries(text).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });

  document.querySelectorAll('.chip').forEach(label => {
    const input = label.querySelector('input[name="body-type"]');
    label.classList.toggle('active', input && input.value === state.measurements.bodyType);
  });

  document.querySelectorAll('[data-fit-mode]').forEach(button => {
    button.classList.toggle('active', button.dataset.fitMode === state.ui.fitMode);
  });

  document.querySelectorAll('[data-overlay-preset]').forEach(button => {
    button.classList.toggle('active', button.dataset.overlayPreset === state.ui.overlayPreset);
  });

  document.querySelectorAll('[data-view-mode]').forEach(button => {
    button.classList.toggle('active', button.dataset.viewMode === state.ui.viewMode);
  });

  document.querySelectorAll('[data-orbit-preset]').forEach(button => {
    button.classList.toggle('active', button.dataset.orbitPreset === state.ui.orbitPreset);
  });

  document.querySelectorAll('[data-tryon-category]').forEach(button => {
    button.classList.toggle('active', button.dataset.tryonCategory === state.ui.tryOnCategory);
  });

  document.getElementById('toggle-guides-btn')?.classList.toggle('active', state.ui.guides);
  document.getElementById('toggle-guides-btn')?.replaceChildren(document.createTextNode(state.ui.guides ? 'Guides On' : 'Guides Off'));
  document.getElementById('toggle-clarity-btn')?.classList.toggle('active', state.ui.fitClarity);
  document.getElementById('toggle-clarity-btn')?.replaceChildren(document.createTextNode(state.ui.fitClarity ? 'Fit Clarity' : 'Clarity Off'));
  document.getElementById('mirror-photo-btn')?.classList.toggle('active', state.ui.mirrorPhoto);
  document.getElementById('mirror-photo-btn')?.replaceChildren(document.createTextNode(state.ui.mirrorPhoto ? 'Mirrored' : 'Mirror Photo'));
  document.getElementById('toggle-avatar-btn')?.classList.toggle('active', state.ui.showAvatar);
  document.getElementById('toggle-avatar-btn')?.replaceChildren(document.createTextNode(state.ui.showAvatar ? 'Guide On' : 'Guide Off'));
  document.getElementById('alignment-guides')?.classList.toggle('hidden', !state.ui.guides);
  document.getElementById('split-slider-shell')?.classList.toggle('hidden', state.ui.viewMode !== 'split');
  document.getElementById('scan-line')?.classList.toggle('hidden', !!state.photoDataUrl);

  const searchInput = document.getElementById('try-on-search');
  if (searchInput && searchInput.value !== state.ui.tryOnSearch) {
    searchInput.value = state.ui.tryOnSearch;
  }

  const photoStatus = document.getElementById('photo-status');
  if (photoStatus) {
    const product = selectedProduct();
    photoStatus.textContent = state.photoDataUrl
      ? `${state.photoName || 'Photo ready'} is loaded. ${state.pose.message || 'Your product opens in full overlay first, and you can switch to Split Compare whenever you want a side-by-side fit check.'} ${product ? productAssetMessage(product) : ''}`
      : 'No picture loaded yet. Add one to unlock the clearest personal 3D fitting view.';
  }

  const stageGuidance = document.getElementById('stage-guidance');
  if (stageGuidance) {
    if (!state.photoDataUrl) {
      stageGuidance.textContent = 'Add your picture for the clearest 3D fit check.';
    } else if (state.pose.status === 'scanning') {
      stageGuidance.textContent = 'Scanning your photo for a body-aware fit...';
    } else if (productCustomAsset(selectedProduct()) && state.ui.fitClarity) {
      stageGuidance.textContent = 'Your saved exact PNG is active with fit clarity and body-aware placement.';
    } else if (state.ui.fitClarity && productAssetState(selectedProduct()) === 'loaded') {
      stageGuidance.textContent = 'Fit Clarity is showing shoulder, waist, and hem guides for the exact PNG garment.';
    } else if (state.pose.detected) {
      stageGuidance.textContent = 'Body-aware fit is active for this photo.';
    } else if (state.ui.viewMode === 'split') {
      stageGuidance.textContent = '3D Split Compare makes shoulder and length checks easier.';
    } else if (state.ui.viewMode === 'garment') {
      stageGuidance.textContent = '3D Garment Focus lets you inspect shape without distractions.';
    } else {
      stageGuidance.textContent = '3D Overlay gives the most natural layered preview.';
    }
  }

  const statusPill = document.getElementById('stage-status-pill');
  if (statusPill) {
    statusPill.textContent = state.ui.viewMode === 'split'
      ? '3D Split'
      : state.ui.viewMode === 'garment'
        ? '3D Garment'
        : '3D Overlay';
  }

  const garmentPill = document.getElementById('garment-status-pill');
  if (garmentPill) {
    garmentPill.textContent = state.photoDataUrl ? '3D Photo Base' : '3D Guide Base';
  }

  const heroCount = document.getElementById('hero-count');
  if (heroCount) {
    heroCount.textContent = String(tryOnProducts().length);
  }
}

function updatePhoto() {
  const img = document.getElementById('uploaded-photo');
  const placeholder = document.getElementById('photo-placeholder');

  if (state.photoDataUrl) {
    img.src = state.photoDataUrl;
    img.classList.remove('hidden');
    placeholder.classList.add('hidden');
  } else {
    img.src = '';
    img.classList.add('hidden');
    placeholder.classList.remove('hidden');
  }

  img.style.opacity = state.ui.viewMode === 'garment' ? '.2' : '1';
}

function updateTryOn() {
  const product = selectedProduct();
  renderAvatar();
  renderGarment();
  renderFitGuideOverlay(product);
  renderSummary();
  renderSizes();
  renderProducts();
  renderPhotoPanel();
  renderFitCheckPanel(product);
  updateDisplays();
  updatePhoto();
  renderScene3D();
}

async function ensurePhotoReady() {
  const photo = document.getElementById('uploaded-photo');
  if (!photo || !state.photoDataUrl) return null;

  if (photo.complete && photo.naturalWidth) {
    return photo;
  }

  return new Promise(resolve => {
    const handleReady = () => {
      photo.removeEventListener('load', handleReady);
      photo.removeEventListener('error', handleReady);
      resolve(photo);
    };

    photo.addEventListener('load', handleReady, { once: true });
    photo.addEventListener('error', handleReady, { once: true });
  });
}

async function analyzePhotoPose() {
  if (!state.photoDataUrl) {
    resetPoseState();
    updateTryOn();
    return;
  }

  const analyzer = await waitForPoseAnalyzer();
  if (!analyzer) {
    state.pose.status = 'unavailable';
    state.pose.detected = false;
    state.pose.message = 'Body-aware scan could not start, so the preview is using fallback fit.';
    updateTryOn();
    return;
  }

  state.pose.status = 'scanning';
  state.pose.detected = false;
  state.pose.message = 'Scanning shoulders and torso for a better wear preview...';
  updateTryOn();

  const photo = await ensurePhotoReady();
  if (!photo || !state.photoDataUrl) return;

  try {
    const result = await analyzer(photo);

    if (result?.ok) {
      state.pose.status = 'ready';
      state.pose.detected = true;
      state.pose.message = 'Body scan ready. The garment will snap closer to your shoulders and torso.';
      state.pose.landmarks = result.landmarks;
      state.pose.body = result.body;
      state.overlay = smartOverlayValues(selectedProduct());
      syncOverlayInputs();
    } else {
      state.pose.status = 'missed';
      state.pose.detected = false;
      state.pose.message = result?.reason || 'The body scan could not find a clear pose in this photo.';
      state.pose.landmarks = null;
      state.pose.body = null;
    }
  } catch (error) {
    state.pose.status = 'error';
    state.pose.detected = false;
    state.pose.message = 'Body-aware scan failed, so the preview is using the fallback fit.';
    state.pose.landmarks = null;
    state.pose.body = null;
  }

  updateTryOn();
}

function selectProductForTryOn(productId) {
  const product = getProductById(productId);
  if (!product) return;

  state.selectedProductId = product.id;
  state.selectedSize = '';
  state.ui.overlayPreset = 'balanced';

  if (state.photoDataUrl) {
    state.ui.viewMode = 'overlay';
    state.ui.orbitPreset = 'front';
    state.ui.sceneOrbit = ORBIT_PRESETS.front.orbit;
    state.ui.sceneDepth = ORBIT_PRESETS.front.depth;
    state.ui.sceneLift = ORBIT_PRESETS.front.lift;
    syncSceneInputs();
  }

  state.overlay = smartOverlayValues(product);
  syncOverlayInputs();
  updateTryOn();
}

function saveCurrentFitDefault() {
  const product = selectedProduct();
  if (!product) return;

  const basePlacement = overlayPlacementForProduct(product, { includeCustom: false });
  const baseOverlay = smartOverlayValues(product, { placement: basePlacement });
  customPlacementLibrary[productStorageKey(product)] = {
    scaleAdjust: clamp(Math.round((basePlacement.scaleAdjust || 0) + (state.overlay.scale - baseOverlay.scale)), -45, 45),
    xAdjust: clamp(Math.round((basePlacement.xAdjust || 0) + (state.overlay.x - baseOverlay.x)), -120, 120),
    yAdjust: clamp(Math.round((basePlacement.yAdjust || 0) + (state.overlay.y - baseOverlay.y)), -120, 120),
    rotateAdjust: clamp(Math.round((basePlacement.rotateAdjust || 0) + (state.overlay.rotate - baseOverlay.rotate)), -25, 25)
  };
  persistStoredMap(STORAGE_KEYS.placements, customPlacementLibrary);
  state.overlay = smartOverlayValues(product);
  syncOverlayInputs();
  updateTryOn();
}

function clearCurrentFitDefault() {
  const product = selectedProduct();
  if (!product) return;

  delete customPlacementLibrary[productStorageKey(product)];
  persistStoredMap(STORAGE_KEYS.placements, customPlacementLibrary);
  autoFitOverlay();
}

function removeCurrentAsset() {
  const product = selectedProduct();
  if (!product) return;

  delete customAssetLibrary[productStorageKey(product)];
  persistStoredMap(STORAGE_KEYS.assets, customAssetLibrary);
  delete garmentAssetState[product.id];
  updateTryOn();
}

function readExactAsset(event) {
  const product = selectedProduct();
  const [file] = event.target.files || [];
  if (!product || !file) return;

  const reader = new FileReader();
  reader.onload = () => {
    customAssetLibrary[productStorageKey(product)] = reader.result;
    persistStoredMap(STORAGE_KEYS.assets, customAssetLibrary);
    delete garmentAssetState[product.id];
    state.ui.fitClarity = true;
    state.ui.viewMode = 'overlay';
    state.overlay = smartOverlayValues(product);
    syncOverlayInputs();
    updateTryOn();
    event.target.value = '';
  };
  reader.readAsDataURL(file);
}

function readPhoto(event) {
  const [file] = event.target.files || [];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    state.photoDataUrl = reader.result;
    state.photoName = file.name;
    state.ui.overlayPreset = 'balanced';
    state.ui.viewMode = 'overlay';
    state.ui.showAvatar = false;
    resetPoseState('Scanning your photo for shoulders and torso...');
    state.overlay = smartOverlayValues(selectedProduct());
    syncOverlayInputs();
    updateTryOn();
    applyOrbitPreset('front');
    void analyzePhotoPose();
  };
  reader.readAsDataURL(file);
}

function handlePhotoDrop(event) {
  event.preventDefault();
  const dropzone = event.currentTarget;
  dropzone.classList.remove('border-[rgba(159,61,47,.5)]');
  const [file] = event.dataTransfer?.files || [];

  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = () => {
    state.photoDataUrl = reader.result;
    state.photoName = file.name;
    state.ui.overlayPreset = 'balanced';
    state.ui.viewMode = 'overlay';
    state.ui.showAvatar = false;
    resetPoseState('Scanning your photo for shoulders and torso...');
    state.overlay = smartOverlayValues(selectedProduct());
    const upload = document.getElementById('photo-upload');
    if (upload) upload.value = '';
    syncOverlayInputs();
    updateTryOn();
    applyOrbitPreset('front');
    void analyzePhotoPose();
  };
  reader.readAsDataURL(file);
}

function resetOverlay() {
  state.overlay = { scale: 100, x: 0, y: 0, rotate: 0, opacity: 88 };
  [
    ['overlay-scale', 100],
    ['overlay-x', 0],
    ['overlay-y', 0],
    ['overlay-rotate', 0],
    ['overlay-opacity', 88]
  ].forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) input.value = value;
  });

  updateTryOn();
}

function centerOverlay() {
  state.overlay.x = 0;
  state.overlay.y = 0;
  const xInput = document.getElementById('overlay-x');
  const yInput = document.getElementById('overlay-y');
  if (xInput) xInput.value = 0;
  if (yInput) yInput.value = 0;
  updateTryOn();
}

function addCurrentToBag() {
  const product = selectedProduct();
  addToCart(product, 1, state.selectedSize);
  const btn = document.getElementById('add-to-bag-btn');
  const original = btn.textContent;
  btn.textContent = 'Added To Bag';
  btn.classList.remove('bg-black');
  btn.classList.add('bg-[#2d6a4f]');

  setTimeout(() => {
    btn.textContent = original;
    btn.classList.add('bg-black');
    btn.classList.remove('bg-[#2d6a4f]');
  }, 1600);
}

function bindRange(id, path, key) {
  const input = document.getElementById(id);
  if (!input) return;
  input.addEventListener('input', event => {
    path[key] = Number(event.target.value);
    updateTryOn();
  });
}

function viewportCenter() {
  const viewport = document.getElementById('try-on-viewport');
  const rect = viewport.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function pointerAngle(event) {
  const center = viewportCenter();
  return Math.atan2(event.clientY - center.y, event.clientX - center.x) * (180 / Math.PI);
}

function endInteraction() {
  interaction.mode = '';
  interaction.pointerId = null;
  interaction.startOverlay = null;
  document.getElementById('garment-wrapper')?.classList.remove('dragging');
}

function beginMove(event) {
  if (event.button !== 0) return;
  interaction.mode = 'move';
  interaction.pointerId = event.pointerId;
  interaction.startX = event.clientX;
  interaction.startY = event.clientY;
  interaction.startOverlay = { ...state.overlay };
  document.getElementById('garment-wrapper')?.classList.add('dragging');
  event.currentTarget.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function beginScale(event) {
  interaction.mode = 'scale';
  interaction.pointerId = event.pointerId;
  interaction.startX = event.clientX;
  interaction.startY = event.clientY;
  interaction.startOverlay = { ...state.overlay };
  document.getElementById('garment-wrapper')?.setPointerCapture(event.pointerId);
  event.preventDefault();
  event.stopPropagation();
}

function beginRotate(event) {
  interaction.mode = 'rotate';
  interaction.pointerId = event.pointerId;
  interaction.startOverlay = { ...state.overlay };
  interaction.startAngle = pointerAngle(event);
  document.getElementById('garment-wrapper')?.setPointerCapture(event.pointerId);
  event.preventDefault();
  event.stopPropagation();
}

function handlePointerMove(event) {
  if (interaction.pointerId !== event.pointerId || !interaction.mode || !interaction.startOverlay) return;

  if (interaction.mode === 'move') {
    state.overlay.x = Math.round(interaction.startOverlay.x + (event.clientX - interaction.startX));
    state.overlay.y = Math.round(interaction.startOverlay.y + (event.clientY - interaction.startY));
    if (Math.abs(state.overlay.x) < 8) state.overlay.x = 0;
    if (Math.abs(state.overlay.y) < 8) state.overlay.y = 0;
  } else if (interaction.mode === 'scale') {
    const delta = (event.clientX - interaction.startX) - (event.clientY - interaction.startY);
    state.overlay.scale = clamp(Math.round(interaction.startOverlay.scale + (delta * 0.25)), 70, 145);
  } else if (interaction.mode === 'rotate') {
    const angleDelta = pointerAngle(event) - interaction.startAngle;
    state.overlay.rotate = clamp(Math.round(interaction.startOverlay.rotate + angleDelta), -25, 25);
  }

  syncOverlayInputs();
  updateTryOn();
}

function handleOverlayWheel(event) {
  event.preventDefault();
  state.overlay.scale = clamp(Math.round(state.overlay.scale - (event.deltaY * 0.05)), 70, 145);
  const scaleInput = document.getElementById('overlay-scale');
  if (scaleInput) scaleInput.value = state.overlay.scale;
  updateTryOn();
}

function handleOverlayKeys(event) {
  const keyActions = {
    ArrowUp: () => { state.overlay.y -= 4; },
    ArrowDown: () => { state.overlay.y += 4; },
    ArrowLeft: () => { state.overlay.x -= 4; },
    ArrowRight: () => { state.overlay.x += 4; },
    '+': () => { state.overlay.scale = clamp(state.overlay.scale + 2, 70, 145); },
    '=': () => { state.overlay.scale = clamp(state.overlay.scale + 2, 70, 145); },
    '-': () => { state.overlay.scale = clamp(state.overlay.scale - 2, 70, 145); },
    '[': () => { state.overlay.rotate = clamp(state.overlay.rotate - 1, -25, 25); },
    ']': () => { state.overlay.rotate = clamp(state.overlay.rotate + 1, -25, 25); }
  };

  const action = keyActions[event.key];
  if (!action) return;

  event.preventDefault();
  action();

  syncOverlayInputs();
  updateTryOn();
}

document.addEventListener('DOMContentLoaded', () => {
  const productIdFromUrl = getProductIdFromUrl();
  if (productIdFromUrl && getProductById(productIdFromUrl)) {
    state.selectedProductId = productIdFromUrl;
  }
  if (!selectedProduct() && tryOnProducts()[0]) {
    state.selectedProductId = tryOnProducts()[0].id;
  }

  bindRange('chest-input', state.measurements, 'chest');
  bindRange('waist-input', state.measurements, 'waist');
  bindRange('height-input', state.measurements, 'height');
  bindRange('overlay-scale', state.overlay, 'scale');
  bindRange('overlay-x', state.overlay, 'x');
  bindRange('overlay-y', state.overlay, 'y');
  bindRange('overlay-rotate', state.overlay, 'rotate');
  bindRange('overlay-opacity', state.overlay, 'opacity');
  bindRange('compare-slider', state.ui, 'compare');
  bindRange('split-slider', state.ui, 'split');

  ['scene-orbit', 'scene-depth', 'scene-lift'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', event => {
      const key = id === 'scene-orbit' ? 'sceneOrbit' : id === 'scene-depth' ? 'sceneDepth' : 'sceneLift';
      state.ui[key] = Number(event.target.value);
      state.ui.orbitPreset = 'custom';
      updateTryOn();
    });
  });

  document.querySelectorAll('input[name="body-type"]').forEach(input => {
    input.addEventListener('change', event => {
      state.measurements.bodyType = event.target.value;
      updateTryOn();
    });
  });

  document.querySelectorAll('[data-fit-mode]').forEach(button => {
    button.addEventListener('click', () => {
      state.ui.fitMode = button.dataset.fitMode;
      updateTryOn();
    });
  });

  document.querySelectorAll('[data-overlay-preset]').forEach(button => {
    button.addEventListener('click', () => {
      state.ui.overlayPreset = button.dataset.overlayPreset;
      autoFitOverlay();
    });
  });

  document.querySelectorAll('[data-view-mode]').forEach(button => {
    button.addEventListener('click', () => {
      state.ui.viewMode = button.dataset.viewMode;
      updateTryOn();
    });
  });

  document.querySelectorAll('[data-orbit-preset]').forEach(button => {
    button.addEventListener('click', () => {
      applyOrbitPreset(button.dataset.orbitPreset);
    });
  });

  document.querySelectorAll('[data-tryon-category]').forEach(button => {
    button.addEventListener('click', () => {
      state.ui.tryOnCategory = button.dataset.tryonCategory;
      renderProducts();
      updateDisplays();
    });
  });

  document.getElementById('try-on-search')?.addEventListener('input', event => {
    state.ui.tryOnSearch = event.target.value;
    renderProducts();
    updateDisplays();
  });

  const upload = document.getElementById('photo-upload');
  if (upload) upload.addEventListener('change', readPhoto);
  document.getElementById('asset-upload-input')?.addEventListener('change', readExactAsset);

  const dropzone = document.querySelector('label[for="photo-upload"]');
  dropzone?.addEventListener('dragover', event => {
    event.preventDefault();
    dropzone.classList.add('border-[rgba(159,61,47,.5)]');
  });
  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-[rgba(159,61,47,.5)]');
  });
  dropzone?.addEventListener('drop', handlePhotoDrop);

  document.getElementById('remove-photo-btn')?.addEventListener('click', () => {
    state.photoDataUrl = '';
    state.photoName = '';
    resetPoseState();
    state.ui.viewMode = 'overlay';
    state.ui.showAvatar = true;
    if (upload) upload.value = '';
    state.overlay = smartOverlayValues(selectedProduct());
    syncOverlayInputs();
    updateTryOn();
  });

  const wrapper = document.getElementById('garment-wrapper');
  wrapper?.addEventListener('pointerdown', beginMove);
  wrapper?.addEventListener('pointermove', handlePointerMove);
  wrapper?.addEventListener('pointerup', endInteraction);
  wrapper?.addEventListener('pointercancel', endInteraction);
  wrapper?.addEventListener('wheel', handleOverlayWheel, { passive: false });
  wrapper?.addEventListener('keydown', handleOverlayKeys);

  document.getElementById('overlay-scale-handle')?.addEventListener('pointerdown', beginScale);
  document.getElementById('overlay-rotate-handle')?.addEventListener('pointerdown', beginRotate);
  document.getElementById('auto-fit-btn')?.addEventListener('click', autoFitOverlay);
  document.getElementById('toggle-guides-btn')?.addEventListener('click', () => {
    state.ui.guides = !state.ui.guides;
    updateTryOn();
  });
  document.getElementById('toggle-clarity-btn')?.addEventListener('click', () => {
    state.ui.fitClarity = !state.ui.fitClarity;
    updateTryOn();
  });
  document.getElementById('mirror-photo-btn')?.addEventListener('click', () => {
    state.ui.mirrorPhoto = !state.ui.mirrorPhoto;
    updateTryOn();
  });
  document.getElementById('toggle-avatar-btn')?.addEventListener('click', () => {
    state.ui.showAvatar = !state.ui.showAvatar;
    updateTryOn();
  });
  document.getElementById('center-overlay-btn')?.addEventListener('click', centerOverlay);

  document.getElementById('reset-overlay-btn')?.addEventListener('click', resetOverlay);
  document.getElementById('save-fit-default-btn')?.addEventListener('click', saveCurrentFitDefault);
  document.getElementById('clear-fit-default-btn')?.addEventListener('click', clearCurrentFitDefault);
  document.getElementById('remove-asset-btn')?.addEventListener('click', removeCurrentAsset);
  document.getElementById('browse-collection-btn')?.addEventListener('click', () => {
    window.location.href = 'collections.html';
  });
  document.getElementById('add-to-bag-btn')?.addEventListener('click', addCurrentToBag);

  state.overlay = smartOverlayValues(selectedProduct());
  syncOverlayInputs();
  syncSceneInputs();
  updateTryOn();
});
