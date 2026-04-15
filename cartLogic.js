const CART_STORAGE_KEY = 'kinetic_muse_cart';

function getCart() {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}

// Expose on window for global access
window.getCart = getCart;

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartBadges();
}

window.addToCart = function(product) {
    const cart = getCart();
    const existing = cart.find(i => i.name === product.name && i.size === product.size);
    if(existing) {
        existing.quantity += 1;
    } else {
        cart.push({...product, quantity: 1, id: Date.now()});
    }
    saveCart(cart);
};

window.updateQuantity = function(id, step) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if(item) {
        item.quantity += step;
        if(item.quantity <= 0) {
            window.removeFromCart(id);
            return;
        }
    }
    saveCart(cart);
    if(typeof renderCartPage === 'function'){
        renderCartPage(); // update Cart page dynamically if viewing
    }
};

window.removeFromCart = function(id) {
    let cart = getCart();
    cart = cart.filter(i => i.id !== id);
    saveCart(cart);
    if(typeof renderCartPage === 'function'){
        renderCartPage(); // update Cart page dynamically if viewing
    }
};

window.updateCartBadges = function() {
    const badges = document.querySelectorAll('#cart-badge');
    const cart = getCart();
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    badges.forEach(b => {
        b.innerText = count;
        if(count > 0) {
            b.style.display = 'flex';
        } else {
            b.style.display = 'none';
        }
    });
};

window.getCartTotals = function() {
    const cart = getCart();
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08; 
    const isCartEmpty = cart.length === 0;
    const shipping = isCartEmpty ? 0 : (subtotal > 200 ? 0 : 15); // Free shipping over $200
    
    return {
        subtotal: subtotal,
        tax: tax,
        shipping: shipping,
        total: subtotal + tax + shipping,
        isEmpty: isCartEmpty
    };
};

window.handleQuickAdd = function(event, name, price, image) {
    event.preventDefault(); 
    event.stopPropagation();
    
    console.log("Quick adding: ", name);
    const product = {
        name: name,
        price: parseFloat(price),
        size: 'O/S', 
        image: image
    };
    window.addToCart(product);
    
    const btn = event.currentTarget;
    const originalText = btn.innerText;
    btn.innerText = 'ADDED!';
    btn.classList.add('bg-secondary', 'text-white');
    setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('bg-secondary', 'text-white');
    }, 1500);
};

window.selectedSize = 'S'; // default
window.handleSizeSelect = function(event) {
    document.querySelectorAll('.size-btn').forEach(b => {
        b.className = 'size-btn py-3 text-xs manrope font-medium bg-surface-container-lowest border border-outline-variant/15 hover:border-primary transition-all';
    });
    const btn = event.currentTarget;
    btn.className = 'size-btn py-3 text-xs manrope font-bold bg-primary text-white border border-primary';
    window.selectedSize = btn.innerText.trim();
};

window.handleDynamicAddToBag = function() {
    const addBtn = document.getElementById('add-to-bag');
    const nameEl = document.querySelector('h1.noto-serif');
    // Find price after the h1 - look for all p tags and get the one with price
    const priceEl = Array.from(document.querySelectorAll('p')).find(p => p.innerText && p.innerText.includes('$'));
    const imgEl = document.querySelector('img[data-alt]');
    
    let priceText = priceEl ? priceEl.innerText.replace(/[^0-9.]/g, '') : "145.00";
    let imageSrc = imgEl ? imgEl.src : 'https://placehold.co/400x500/000000/FFF?text=KINETIC';
    
    const product = {
        name: nameEl ? nameEl.innerText.trim() : 'KINETIC APPAREL',
        price: parseFloat(priceText) || 145.00,
        size: window.selectedSize,
        image: imageSrc
    };
    
    console.log('Adding to cart:', product);
    
    window.addToCart(product);
    if (addBtn) {
        const originalText = addBtn.innerText;
        addBtn.innerText = 'ADDED TO BAG!';
        addBtn.classList.add('bg-secondary', 'text-white');
        setTimeout(() => {
            addBtn.innerText = originalText;
            addBtn.classList.remove('bg-secondary', 'text-white');
        }, 2000);
    }
};

// Auto-run badge update on load
document.addEventListener('DOMContentLoaded', function() {
    window.updateCartBadges();
    
    // Attach Quick Add listeners to all buttons
    document.querySelectorAll('button').forEach(btn => {
        if(btn.innerText && btn.innerText.includes('Quick Add')) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const card = this.closest('.group');
                if(!card) return;
                
                const nameEl = card.querySelector('h4, h5');
                const priceEl = Array.from(card.querySelectorAll('p')).find(p => p.innerText && p.innerText.includes('$'));
                const imgEl = card.querySelector('img');
                
                const name = nameEl ? nameEl.innerText.trim() : 'KINETIC ITEM';
                const price = priceEl ? parseFloat(priceEl.innerText.replace(/[^0-9.]/g, '')) : 100.00;
                const image = imgEl ? imgEl.src : '';
                
                console.log('Quick Add:', name, price);
                
                window.handleQuickAdd(e, name, price, image);
            });
        }
    });
});
