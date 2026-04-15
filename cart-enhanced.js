/**
 * KINETIC MUSE - Unified Cart & Wishlist System
 * Keeps the newer catalog-driven shopping flow in one place.
 */

const CART_STORAGE_KEY = 'kinetic-cart';
const WISHLIST_STORAGE_KEY = 'kinetic-wishlist';
const LEGACY_CART_STORAGE_KEY = 'kinetic_muse_cart';

function safeParseStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return [];
  }
}

function slugify(value) {
  return String(value || 'item')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function findCatalogProductByName(name) {
  if (typeof getAllProducts !== 'function') return null;
  const normalized = String(name || '').trim().toLowerCase();
  return getAllProducts().find(product => product.name.trim().toLowerCase() === normalized) || null;
}

function normalizeCartItem(item, index = 0) {
  if (!item) return null;

  const catalogProduct = item.id && typeof getProductById === 'function'
    ? getProductById(Number(item.id))
    : findCatalogProductByName(item.name);

  const name = item.name || catalogProduct?.name || `Item ${index + 1}`;
  const size = item.size || catalogProduct?.sizes?.[0] || 'M';
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const price = Number(item.price ?? catalogProduct?.price ?? 0);
  const id = item.id ?? catalogProduct?.id ?? `legacy-${slugify(name)}-${slugify(size)}`;

  return {
    id,
    name,
    price,
    image: item.image || catalogProduct?.image || 'https://placehold.co/800x1000/f5efe8/161616?text=KINETIC+MUSE',
    category: item.category || catalogProduct?.category || 'curated',
    size,
    quantity,
    color: item.color || catalogProduct?.color || '',
    sourceProductId: catalogProduct?.id || (typeof id === 'number' ? id : null)
  };
}

function persistCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartBadge();
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
  } catch (error) {
    console.error('Error saving cart:', error);
  }
}

function migrateLegacyCart() {
  const currentCart = safeParseStorage(CART_STORAGE_KEY);
  if (currentCart.length) return;

  const legacyCart = safeParseStorage(LEGACY_CART_STORAGE_KEY);
  if (!legacyCart.length) return;

  const migrated = legacyCart
    .map((item, index) => normalizeCartItem(item, index))
    .filter(Boolean);

  if (migrated.length) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(migrated));
  }

  localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
}

function getCart() {
  return safeParseStorage(CART_STORAGE_KEY)
    .map((item, index) => normalizeCartItem(item, index))
    .filter(Boolean);
}

function saveCart(cart) {
  const normalized = cart
    .map((item, index) => normalizeCartItem(item, index))
    .filter(Boolean);
  persistCart(normalized);
  return normalized;
}

function addToCart(product, quantity = 1, size = 'M') {
  if (!product) return getCart();

  const cart = getCart();
  const selectedSize = size || (product.sizes?.includes('M') ? 'M' : product.sizes?.[0]) || 'M';
  const productId = product.id ?? `catalog-${slugify(product.name)}-${slugify(selectedSize)}`;

  const existingIndex = cart.findIndex(item => item.id === productId && item.size === selectedSize);

  if (existingIndex > -1) {
    cart[existingIndex].quantity += Math.max(1, Number(quantity) || 1);
  } else {
    cart.push(normalizeCartItem({
      id: productId,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      color: product.color,
      size: selectedSize,
      quantity: Math.max(1, Number(quantity) || 1)
    }));
  }

  return saveCart(cart);
}

function removeFromCart(id, size) {
  const cart = getCart().filter(item => !(String(item.id) === String(id) && item.size === size));
  return saveCart(cart);
}

function updateQuantity(id, size, step) {
  const cart = getCart();
  const match = cart.find(item => String(item.id) === String(id) && item.size === size);

  if (!match) return cart;

  match.quantity += Number(step) || 0;

  if (match.quantity <= 0) {
    return removeFromCart(id, size);
  }

  return saveCart(cart);
}

function getCartTotals() {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const shipping = cart.length === 0 ? 0 : (subtotal >= 200 ? 0 : 15);
  const tax = subtotal * 0.08;

  return {
    subtotal,
    tax,
    shipping,
    total: subtotal + tax + shipping,
    itemCount: cart.reduce((sum, item) => sum + Number(item.quantity), 0),
    lineCount: cart.length,
    isEmpty: cart.length === 0
  };
}

function updateBadgeElements(selector, count) {
  document.querySelectorAll(selector).forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
    badge.classList.toggle('hidden', count <= 0);
  });
}

function updateCartBadge() {
  const count = getCartTotals().itemCount;
  updateBadgeElements('#cart-badge, [data-cart-badge]', count);
}

function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
  updateCartBadge();
  const emptyCart = [];
  window.dispatchEvent(new CustomEvent('cartCleared'));
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: emptyCart }));
}

function getWishlist() {
  return safeParseStorage(WISHLIST_STORAGE_KEY);
}

function saveWishlist(wishlist) {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    updateWishlistBadge();
    window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: wishlist }));
  } catch (error) {
    console.error('Error saving wishlist:', error);
  }
  return wishlist;
}

function addToWishlist(product) {
  if (!product) return getWishlist();
  const wishlist = getWishlist();

  if (!wishlist.some(item => item.id === product.id)) {
    wishlist.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      addedDate: new Date().toISOString()
    });
  }

  return saveWishlist(wishlist);
}

function removeFromWishlist(productId) {
  const wishlist = getWishlist().filter(item => item.id !== productId);
  return saveWishlist(wishlist);
}

function isInWishlist(productId) {
  return getWishlist().some(item => item.id === productId);
}

function updateWishlistBadge() {
  updateBadgeElements('#wishlist-badge, [data-wishlist-badge]', getWishlist().length);
}

function preferredQuickAddSize(product) {
  if (!product?.sizes?.length) return 'M';
  return product.sizes.includes('M') ? 'M' : product.sizes[0];
}

function handleQuickAdd(event, productId) {
  event.preventDefault();
  event.stopPropagation();

  const product = typeof getProductById === 'function' ? getProductById(productId) : null;
  if (!product) return;

  addToCart(product, 1, preferredQuickAddSize(product));

  const button = event.target.closest('button');
  if (!button) return;

  const originalText = button.textContent;
  button.textContent = 'Added';
  button.classList.add('bg-emerald-600', 'text-white');

  setTimeout(() => {
    button.textContent = originalText;
    button.classList.remove('bg-emerald-600', 'text-white');
  }, 1400);
}

function handleWishlistToggle(event, productId) {
  event.preventDefault();
  event.stopPropagation();

  const button = event.target.closest('button');
  const icon = button?.querySelector('.material-symbols-outlined') || button;

  if (isInWishlist(productId)) {
    removeFromWishlist(productId);
    icon?.classList.remove('text-red-500');
  } else {
    addToWishlist(typeof getProductById === 'function' ? getProductById(productId) : null);
    icon?.classList.add('text-red-500');
  }
}

window.getCart = getCart;
window.saveCart = saveCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.getCartTotals = getCartTotals;
window.clearCart = clearCart;
window.getWishlist = getWishlist;
window.saveWishlist = saveWishlist;
window.addToWishlist = addToWishlist;
window.removeFromWishlist = removeFromWishlist;
window.isInWishlist = isInWishlist;
window.updateCartBadge = updateCartBadge;
window.updateWishlistBadge = updateWishlistBadge;
window.handleQuickAdd = handleQuickAdd;
window.handleWishlistToggle = handleWishlistToggle;

document.addEventListener('DOMContentLoaded', () => {
  migrateLegacyCart();
  updateCartBadge();
  updateWishlistBadge();
});

window.addEventListener('storage', event => {
  if (event.key === CART_STORAGE_KEY || event.key === WISHLIST_STORAGE_KEY) {
    updateCartBadge();
    updateWishlistBadge();
  }
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getCart,
    saveCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    getCartTotals,
    clearCart,
    getWishlist,
    saveWishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    updateCartBadge,
    updateWishlistBadge,
    handleQuickAdd,
    handleWishlistToggle
  };
}
