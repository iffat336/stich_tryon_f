(function initVirtualTryOnEngine() {
  function buildApiRequest(payload) {
    return {
      provider: 'virtual-tryon',
      customer: {
        photo: payload.photoDataUrl || '',
        measurements: payload.measurements,
        poseDetected: !!payload.poseDetected
      },
      garment: {
        id: payload.product?.id || null,
        name: payload.product?.name || '',
        productImage: payload.product?.image || '',
        exactAsset: payload.garmentSource || '',
        selectedSize: payload.selectedSize || '',
        color: payload.product?.color || ''
      },
      requested_views: ['front', 'left', 'right'],
      metadata: {
        generated_from: payload.provider,
        timestamp: new Date().toISOString()
      }
    };
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      if (!src) {
        reject(new Error('Missing image source'));
        return;
      }

      const image = new Image();
      if (/^https?:/i.test(src)) {
        image.crossOrigin = 'anonymous';
      }
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load image: ${src}`));
      image.src = src;
    });
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function drawCover(ctx, image, dx, dy, dWidth, dHeight, alignX = 0.5) {
    const scale = Math.max(dWidth / image.width, dHeight / image.height);
    const sWidth = dWidth / scale;
    const sHeight = dHeight / scale;
    const sx = Math.max(0, (image.width - sWidth) * alignX);
    const sy = Math.max(0, (image.height - sHeight) * 0.08);
    ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
  }

  function viewAdjustments(view) {
    if (view === 'left') {
      return { rotate: -8, scaleX: 0.94, translateX: -26, translateY: 4 };
    }
    if (view === 'right') {
      return { rotate: 8, scaleX: 0.94, translateX: 26, translateY: 4 };
    }
    return { rotate: 0, scaleX: 1, translateX: 0, translateY: 0 };
  }

  function drawGarmentLayer(ctx, garmentImage, payload, view, frame) {
    if (!garmentImage) return;

    const overlay = payload.overlay || { scale: 100, x: 0, y: 0, rotate: 0, opacity: 88 };
    const scaleX = frame.width / 320;
    const scaleY = frame.height / 520;
    const adjust = viewAdjustments(view);
    const centerX = frame.x + (frame.width / 2) + (overlay.x * scaleX) + adjust.translateX;
    const centerY = frame.y + (frame.height / 2) + (overlay.y * scaleY) + adjust.translateY;
    const garmentScale = overlay.scale / 100;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(((overlay.rotate || 0) + adjust.rotate) * (Math.PI / 180));
    ctx.scale(garmentScale * adjust.scaleX, garmentScale);
    ctx.globalAlpha = Math.max(0.52, Math.min(1, (overlay.opacity || 88) / 100));
    ctx.filter = 'drop-shadow(0 16px 18px rgba(17,17,17,.18))';
    ctx.drawImage(garmentImage, -frame.width / 2, -frame.height / 2, frame.width, frame.height);
    ctx.restore();
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
  }

  async function buildMockView(payload, view) {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    const photo = await loadImage(payload.photoDataUrl);
    const garmentSource = payload.garmentRender?.src || payload.garmentSource || payload.product?.image || '';
    let garmentImage = null;

    if (garmentSource) {
      try {
        garmentImage = await loadImage(garmentSource);
      } catch (error) {
        garmentImage = null;
      }
    }

    const gradients = {
      front: ['#f4ede5', '#ddd2c1'],
      left: ['#e9eee9', '#d8d0c5'],
      right: ['#efe7de', '#d4c8ba']
    };
    const [topColor, bottomColor] = gradients[view] || gradients.front;
    const background = ctx.createLinearGradient(0, 0, 0, canvas.height);
    background.addColorStop(0, topColor);
    background.addColorStop(1, bottomColor);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255,255,255,.62)';
    ctx.beginPath();
    ctx.arc(canvas.width * 0.7, canvas.height * 0.22, 180, 0, Math.PI * 2);
    ctx.fill();

    roundedRect(ctx, 72, 92, 756, 962, 36);
    ctx.save();
    ctx.clip();
    drawCover(ctx, photo, 72, 92, 756, 962, view === 'left' ? 0.62 : view === 'right' ? 0.38 : 0.5);
    drawGarmentLayer(ctx, garmentImage, payload, view, { x: 72, y: 92, width: 756, height: 962 });
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,.84)';
    roundedRect(ctx, 92, 110, 250, 52, 26);
    ctx.fill();
    ctx.fillStyle = '#3f352f';
    ctx.font = '700 20px Manrope, sans-serif';
    ctx.fillText('Studio Demo Preview', 124, 144);

    ctx.fillStyle = '#181716';
    ctx.font = '700 40px Noto Serif, serif';
    ctx.fillText(`${view.charAt(0).toUpperCase()}${view.slice(1)} View`, 96, 1128);
    ctx.font = '500 24px Manrope, sans-serif';
    ctx.fillStyle = 'rgba(24,23,22,.72)';
    ctx.fillText(payload.product?.name || 'Selected Garment', 96, 1164);

    ctx.fillStyle = 'rgba(255,255,255,.86)';
    roundedRect(ctx, 614, 118, 178, 246, 28);
    ctx.fill();
    if (garmentImage) {
      roundedRect(ctx, 632, 136, 142, 178, 20);
      ctx.save();
      ctx.clip();
      drawCover(ctx, garmentImage, 632, 136, 142, 178, 0.5);
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(24,23,22,.08)';
      roundedRect(ctx, 632, 136, 142, 178, 20);
      ctx.fill();
      ctx.fillStyle = 'rgba(24,23,22,.48)';
      ctx.font = '700 16px Manrope, sans-serif';
      ctx.fillText('Garment', 666, 224);
    }

    ctx.fillStyle = '#181716';
    ctx.font = '700 15px Manrope, sans-serif';
    ctx.fillText(payload.selectedSize ? `Size ${payload.selectedSize}` : 'Size Pending', 640, 338);
    ctx.fillStyle = 'rgba(24,23,22,.6)';
    ctx.font = '500 14px Manrope, sans-serif';
    ctx.fillText('Backend-ready virtual try-on flow.', 640, 360);

    return canvas.toDataURL('image/jpeg', 0.92);
  }

  async function runHuggingFaceTryOn(payload, hfToken) {
    const garmentSrc = payload.garmentRender?.src || payload.garmentSource || payload.product?.image || '';
    if (!payload.photoDataUrl) throw new Error('No person photo uploaded.');
    if (!garmentSrc) throw new Error('No garment image found for this product.');
    if (!hfToken) throw new Error('HuggingFace token missing. Enter your hf_ token and save.');

    const response = await fetch('/api/tryon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personImage: payload.photoDataUrl,
        garmentImage: garmentSrc,
        hfToken
      })
    });

    const data = await response.json();
    if (!data.ok) throw new Error(data.error || 'Try-on failed. Please try again.');
    if (!data.result) throw new Error('No result image returned.');
    return data.result;
  }

  async function generateTryOn(payload, options = {}) {
    const provider = options.provider || 'mock';
    const request = buildApiRequest({ ...payload, provider });

    if (provider === 'huggingface') {
      const hfToken = options.hfToken || window.localStorage.getItem('hf.token') || '';
      try {
        const resultUrl = await runHuggingFaceTryOn(payload, hfToken);
        return {
          ok: true,
          provider,
          request,
          generatedAt: new Date().toISOString(),
          status: 'hf-ready',
          views: { front: resultUrl, left: resultUrl, right: resultUrl }
        };
      } catch (err) {
        return {
          ok: false,
          provider,
          request,
          generatedAt: new Date().toISOString(),
          status: 'error',
          error: err.message,
          views: { front: null, left: null, right: null }
        };
      }
    }

    if (provider === 'api') {
      return {
        ok: true,
        provider,
        request,
        generatedAt: new Date().toISOString(),
        views: { front: null, left: null, right: null },
        status: 'api-ready'
      };
    }

    return {
      ok: true,
      provider,
      request,
      generatedAt: new Date().toISOString(),
      status: 'mock-ready',
      views: {
        front: await buildMockView(payload, 'front'),
        left: await buildMockView(payload, 'left'),
        right: await buildMockView(payload, 'right')
      }
    };
  }

  window.VirtualTryOnEngine = {
    generateTryOn,
    buildApiRequest,
    providers: {
      mock: { id: 'mock', label: 'Studio Demo' },
      huggingface: { id: 'huggingface', label: 'HuggingFace (Real AI)' },
      api: { id: 'api', label: 'API Ready' }
    }
  };
})();
