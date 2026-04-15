const state = {
  selectedProductId: 4,
  selectedSize: 'M',
  photoDataUrl: '',
  photoName: '',
  measurements: { chest: 36, waist: 32, height: 66, bodyType: 'slim' },
  overlay: { scale: 100, x: 0, y: 0, rotate: 0, opacity: 88 },
  ui: {
    compare: 100,
    split: 54,
    guides: true,
    mirrorPhoto: false,
    showAvatar: true,
    tryOnCategory: 'all',
    tryOnSearch: '',
    fitMode: 'balanced',
    overlayPreset: 'balanced',
    viewMode: 'overlay'
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  if (sub === 'leggings' || sub === 'shorts' || sub === 'skort' || sub === 'pants' || sub === 'trousers') return 'bottom';
  if (sub === 'sports-bra' || sub === 'tops' || sub === 'jackets' || sub === 't-shirts') return 'top';
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

function smartOverlayValues(product) {
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
    bottom: { scale: 104, y: 58 },
    dress: { scale: 108, y: 18 },
    full: { scale: 114, y: 26 }
  };

  const base = baseByType[type] || baseByType.top;
  const fitScale = state.ui.fitMode === 'relaxed' ? 3 : state.ui.fitMode === 'fitted' ? -2 : 0;
  const bodyShift = state.measurements.bodyType === 'curvy' ? 4 : state.measurements.bodyType === 'slim' ? -2 : 0;

  return {
    scale: clamp(Math.round(base.scale + fitScale + chestFactor + photoOffset + presetFactor.scale), 70, 145),
    x: 0,
    y: clamp(Math.round(base.y + heightFactor + bodyShift + presetFactor.y), -90, 110),
    rotate: 0,
    opacity: clamp(Math.round((state.photoDataUrl ? 84 : 90) + presetFactor.opacity), 50, 100)
  };
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
      <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#efb5a0"/><stop offset="100%" stop-color="#d9937f"/></linearGradient>
      <linearGradient id="base" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff" stop-opacity=".95"/><stop offset="100%" stop-color="#e9ded0" stop-opacity=".88"/></linearGradient>
    </defs>
    <ellipse cx="160" cy="490" rx="82" ry="14" fill="rgba(17,17,17,.08)"/>
    <circle cx="160" cy="68" r="34" fill="url(#skin)"/>
    <rect x="149" y="95" width="22" height="22" rx="10" fill="url(#skin)"/>
    <path d="M ${160 - shoulder / 2} 132 C ${160 - shoulder / 2 - 12} 210, ${160 - hip / 2} ${255 + torso * .18}, ${160 - waistWidth / 2} ${300 + torso * .18} L ${160 + waistWidth / 2} ${300 + torso * .18} C ${160 + hip / 2} ${255 + torso * .18}, ${160 + shoulder / 2 + 12} 210, ${160 + shoulder / 2} 132 Z" fill="url(#base)" stroke="rgba(17,17,17,.08)" stroke-width="2"/>
    <path d="M ${160 - shoulder / 2 + 12} 148 C 92 220, 96 320, 108 364" fill="none" stroke="rgba(17,17,17,.06)" stroke-width="20" stroke-linecap="round"/>
    <path d="M ${160 + shoulder / 2 - 12} 148 C 228 220, 224 320, 212 364" fill="none" stroke="rgba(17,17,17,.06)" stroke-width="20" stroke-linecap="round"/>
    <path d="M 142 ${306 + torso * .16} C 138 390, 132 430, 126 480" fill="none" stroke="url(#skin)" stroke-width="24" stroke-linecap="round"/>
    <path d="M 178 ${306 + torso * .16} C 182 390, 188 430, 194 480" fill="none" stroke="url(#skin)" stroke-width="24" stroke-linecap="round"/>
  `;

  let opacity = state.photoDataUrl ? '0.18' : '1';
  if (state.ui.viewMode === 'garment') {
    opacity = state.photoDataUrl ? '0.08' : '0.62';
  }

  svg.style.opacity = state.ui.showAvatar ? opacity : '0';
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
    </defs>
  `;

  if (type === 'top') {
    shapes += `
      <path d="M ${c - shoulder / 2} ${top} C ${c - shoulder / 2 - 20} ${top + 35}, ${c - waistWidth / 2 - 6} ${top + 95}, ${c - waistWidth / 2} ${top + length} L ${c + waistWidth / 2} ${top + length} C ${c + waistWidth / 2 + 6} ${top + 95}, ${c + shoulder / 2 + 20} ${top + 35}, ${c + shoulder / 2} ${top} L ${c + shoulder / 2 - 16} ${top - 20} Q ${c} ${top - 4} ${c - shoulder / 2 + 16} ${top - 20} Z" fill="url(#fill)"/>
      <path d="M ${c - shoulder / 2 + 12} ${top + 22} C ${c - shoulder / 2 - 30} ${top + 78}, ${c - shoulder / 2 - 34} ${top + 145}, ${c - shoulder / 2 - 10} ${top + 202}" fill="none" stroke="${colors.fill}" stroke-width="22" stroke-linecap="round"/>
      <path d="M ${c + shoulder / 2 - 12} ${top + 22} C ${c + shoulder / 2 + 30} ${top + 78}, ${c + shoulder / 2 + 34} ${top + 145}, ${c + shoulder / 2 + 10} ${top + 202}" fill="none" stroke="${colors.fill}" stroke-width="22" stroke-linecap="round"/>
    `;
  }

  if (type === 'bottom') {
    shapes += `
      <path d="M ${c - hip / 2} ${top} Q ${c - 12} ${top + 24} ${c - 10} ${top + 48} L ${c - 18} ${top + bottom} L ${c - 48} ${top + bottom} L ${c - 68} ${top + 52} Q ${c - hip / 2 + 8} ${top + 18} ${c - hip / 2} ${top} Z" fill="url(#fill)"/>
      <path d="M ${c + hip / 2} ${top} Q ${c + 12} ${top + 24} ${c + 10} ${top + 48} L ${c + 18} ${top + bottom} L ${c + 48} ${top + bottom} L ${c + 68} ${top + 52} Q ${c + hip / 2 - 8} ${top + 18} ${c + hip / 2} ${top} Z" fill="url(#fill)"/>
      <rect x="${c - hip / 2}" y="${top - 18}" width="${hip}" height="34" rx="14" fill="${colors.shadow}"/>
    `;
  }

  if (type === 'dress' || type === 'full') {
    shapes += `
      <path d="M ${c - shoulder / 2} ${top} C ${c - shoulder / 2 - 26} ${top + 45}, ${c - hem / 2} ${top + 135}, ${c - hem / 2} ${top + length} L ${c + hem / 2} ${top + length} C ${c + hem / 2} ${top + 135}, ${c + shoulder / 2 + 26} ${top + 45}, ${c + shoulder / 2} ${top} L ${c + shoulder / 2 - 16} ${top - 18} Q ${c} ${top - 6} ${c - shoulder / 2 + 16} ${top - 18} Z" fill="url(#fill)"/>
      <path d="M ${c - shoulder / 2 + 10} ${top + 16} C ${c - shoulder / 2 - 38} ${top + 72}, ${c - shoulder / 2 - 40} ${top + 145}, ${c - shoulder / 2 - 12} ${top + 208}" fill="none" stroke="${colors.fill}" stroke-width="22" stroke-linecap="round"/>
      <path d="M ${c + shoulder / 2 - 10} ${top + 16} C ${c + shoulder / 2 + 38} ${top + 72}, ${c + shoulder / 2 + 40} ${top + 145}, ${c + shoulder / 2 + 12} ${top + 208}" fill="none" stroke="${colors.fill}" stroke-width="22" stroke-linecap="round"/>
      <path d="M ${c} ${top + 34} L ${c} ${top + length - 30}" stroke="${colors.accent}" stroke-width="5" stroke-linecap="round" stroke-opacity=".32"/>
      <circle cx="${c - 16}" cy="${top + 64}" r="4" fill="${colors.accent}" fill-opacity=".68"/><circle cx="${c + 16}" cy="${top + 64}" r="4" fill="${colors.accent}" fill-opacity=".68"/>
    `;

    if (type === 'full') {
      shapes += `
        <path d="M ${c - 72} ${top + 178} Q ${c - 8} ${top + 134} ${c + 90} ${top + 110}" fill="none" stroke="${colors.accent}" stroke-width="14" stroke-linecap="round" stroke-opacity=".24"/>
        <path d="M ${c - 28} ${top + length - 18} C ${c - 32} ${top + length + 42}, ${c - 38} ${top + length + 84}, ${c - 40} ${top + length + 128}" fill="none" stroke="${colors.shadow}" stroke-width="24" stroke-linecap="round"/>
        <path d="M ${c + 28} ${top + length - 18} C ${c + 32} ${top + length + 42}, ${c + 38} ${top + length + 84}, ${c + 40} ${top + length + 128}" fill="none" stroke="${colors.shadow}" stroke-width="24" stroke-linecap="round"/>
      `;
    }
  }

  shapes += `<path d="M 110 100 Q 160 56 210 100" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="10"/>`;
  return shapes;
}

function renderGarment() {
  const svg = document.getElementById('garment-svg');
  const wrapper = document.getElementById('garment-wrapper');
  const product = selectedProduct();
  const shadow = document.getElementById('product-shadow');
  const divider = document.getElementById('split-divider');
  if (!svg || !wrapper || !product) return;

  svg.innerHTML = garmentSvg(product);
  wrapper.style.transform = `translate(${state.overlay.x}px, ${state.overlay.y}px) scale(${state.overlay.scale / 100}) rotate(${state.overlay.rotate}deg)`;
  wrapper.style.opacity = (state.overlay.opacity / 100) * (state.ui.compare / 100);
  wrapper.style.filter = state.ui.viewMode === 'garment'
    ? 'drop-shadow(0 24px 24px rgba(17,17,17,.22))'
    : 'drop-shadow(0 18px 18px rgba(17,17,17,.16))';
  wrapper.style.clipPath = state.ui.viewMode === 'split'
    ? `polygon(${state.ui.split}% 0, 100% 0, 100% 100%, ${state.ui.split}% 100%)`
    : 'none';

  if (shadow) {
    const width = productType(product) === 'bottom' ? 34 : productType(product) === 'top' ? 38 : 48;
    const height = productType(product) === 'full' ? 11 : 9;
    shadow.style.width = `${width}%`;
    shadow.style.height = `${height}%`;
    shadow.style.transform = `translateX(calc(-50% + ${state.overlay.x * 0.3}px)) scale(${Math.max(0.78, state.overlay.scale / 118)})`;
    shadow.style.opacity = state.ui.viewMode === 'garment' ? '0.34' : '0.24';
  }

  if (divider) {
    divider.classList.toggle('hidden', state.ui.viewMode !== 'split');
    divider.style.left = `${state.ui.split}%`;
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

function renderSummary() {
  const product = selectedProduct();
  const summary = document.getElementById('selected-product-summary');
  const rec = recommendSize(product);

  state.selectedSize = state.selectedSize && product.sizes.includes(state.selectedSize) ? state.selectedSize : rec.size;
  document.getElementById('recommended-size').textContent = state.selectedSize;
  document.getElementById('fit-confidence').textContent = rec.label;
  document.getElementById('fit-explainer').textContent = `For ${product.name}, your ${state.measurements.chest}" chest and ${state.measurements.waist}" waist point to ${rec.size} with a ${state.ui.fitMode} fit preference.`;

  summary.innerHTML = `
    <div class="grid gap-4 sm:grid-cols-[112px_minmax(0,1fr)]">
      <div class="summary-image"><img src="${product.image}" alt="${product.name}"></div>
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-xs uppercase tracking-[0.22em] text-black/40">${productTypeLabel(product)} / ${product.line}</p>
          <span class="rounded-full bg-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">$${product.price}</span>
        </div>
        <h3 class="mt-2 text-2xl font-semibold">${product.name}</h3>
        <p class="mt-1 text-sm text-black/55">${productStructureLabel(product)}</p>
        <p class="mt-2 text-sm leading-7 text-black/60">${product.description}</p>
      </div>
    </div>
    <div class="flex flex-wrap gap-2 pt-2 text-xs uppercase tracking-[0.16em] text-black/45">${product.features.slice(0, 3).map(feature => `<span class="rounded-full border border-black/10 bg-black/[0.03] px-3 py-2">${feature}</span>`).join('')}</div>
    <div class="flex flex-wrap gap-2 pt-3">
      <a href="product.html?productId=${product.id}" class="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-black hover:text-white">View Details</a>
      <a href="collections.html" class="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-black hover:text-white">More Products</a>
      <button type="button" onclick="autoFitOverlay()" class="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-black hover:text-white">Auto Fit</button>
    </div>
  `;

  renderInsights(product);
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
      renderSizes();
      document.getElementById('recommended-size').textContent = size;
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
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `product-card rounded-[24px] border border-black/10 bg-white/75 p-4 text-left ${product.id === state.selectedProductId ? 'active' : ''}`;
    card.innerHTML = `
      <div class="overflow-hidden rounded-[18px] bg-[#f5efe8]"><img src="${product.image}" alt="${product.name}" class="h-60 w-full object-cover"></div>
      <div class="mt-4 flex items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.22em] text-black/40">${productTypeLabel(product)} / ${product.line}</p>
          <h3 class="mt-1 text-lg font-semibold">${product.name}</h3>
          <p class="mt-1 text-sm text-black/55">${productStructureLabel(product)}</p>
          <p class="mt-2 text-xs text-black/45">${product.color} / ${product.supportLevel} / $${product.price}</p>
        </div>
      </div>
    `;
    card.addEventListener('click', () => {
      state.selectedProductId = product.id;
      state.selectedSize = '';
      updateTryOn();
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
    'split-display': `${state.ui.split}%`
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

  document.querySelectorAll('[data-tryon-category]').forEach(button => {
    button.classList.toggle('active', button.dataset.tryonCategory === state.ui.tryOnCategory);
  });

  document.getElementById('toggle-guides-btn')?.classList.toggle('active', state.ui.guides);
  document.getElementById('toggle-guides-btn')?.replaceChildren(document.createTextNode(state.ui.guides ? 'Guides On' : 'Guides Off'));
  document.getElementById('mirror-photo-btn')?.classList.toggle('active', state.ui.mirrorPhoto);
  document.getElementById('mirror-photo-btn')?.replaceChildren(document.createTextNode(state.ui.mirrorPhoto ? 'Mirrored' : 'Mirror Photo'));
  document.getElementById('toggle-avatar-btn')?.classList.toggle('active', state.ui.showAvatar);
  document.getElementById('toggle-avatar-btn')?.replaceChildren(document.createTextNode(state.ui.showAvatar ? 'Avatar On' : 'Avatar Off'));
  document.getElementById('alignment-guides')?.classList.toggle('hidden', !state.ui.guides);
  document.getElementById('split-slider-shell')?.classList.toggle('hidden', state.ui.viewMode !== 'split');

  const searchInput = document.getElementById('try-on-search');
  if (searchInput && searchInput.value !== state.ui.tryOnSearch) {
    searchInput.value = state.ui.tryOnSearch;
  }

  const photoStatus = document.getElementById('photo-status');
  if (photoStatus) {
    photoStatus.textContent = state.photoDataUrl
      ? `${state.photoName || 'Photo ready'} loaded. Auto Fit can realign the garment any time.`
      : 'No photo loaded yet. The mannequin preview is active.';
  }

  const stageGuidance = document.getElementById('stage-guidance');
  if (stageGuidance) {
    stageGuidance.textContent = state.ui.viewMode === 'split'
      ? 'Split mode helps compare original photo against the current drape.'
      : state.ui.viewMode === 'garment'
        ? 'Garment focus dims the base so you can inspect shape and placement.'
        : 'Overlay mode gives the most natural full preview.';
  }

  const statusPill = document.getElementById('stage-status-pill');
  if (statusPill) {
    statusPill.textContent = state.ui.viewMode === 'split'
      ? 'Split Compare'
      : state.ui.viewMode === 'garment'
        ? 'Garment Focus'
        : 'Overlay Mode';
  }

  const garmentPill = document.getElementById('garment-status-pill');
  if (garmentPill) {
    garmentPill.textContent = state.photoDataUrl ? 'Photo Loaded' : 'Model Base';
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

  img.style.transform = state.ui.mirrorPhoto ? 'scaleX(-1)' : 'none';
  img.style.opacity = state.ui.viewMode === 'garment' ? '.2' : '1';
}

function updateTryOn() {
  renderAvatar();
  renderGarment();
  renderSummary();
  renderSizes();
  renderProducts();
  updateDisplays();
  updatePhoto();
}

function readPhoto(event) {
  const [file] = event.target.files || [];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    state.photoDataUrl = reader.result;
    state.photoName = file.name;
    state.ui.overlayPreset = 'balanced';
    state.overlay = smartOverlayValues(selectedProduct());
    syncOverlayInputs();
    updateTryOn();
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
    state.overlay = smartOverlayValues(selectedProduct());
    const upload = document.getElementById('photo-upload');
    if (upload) upload.value = '';
    syncOverlayInputs();
    updateTryOn();
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
  document.getElementById('browse-collection-btn')?.addEventListener('click', () => {
    window.location.href = 'collections.html';
  });
  document.getElementById('add-to-bag-btn')?.addEventListener('click', addCurrentToBag);

  state.overlay = smartOverlayValues(selectedProduct());
  syncOverlayInputs();
  updateTryOn();
});
