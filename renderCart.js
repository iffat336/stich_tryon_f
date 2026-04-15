function renderCartPage() {
    const container = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingEl = document.getElementById('cart-shipping');
    const taxEl = document.getElementById('cart-tax');
    const totalEl = document.getElementById('cart-total');

    if (!container) return; // Not on the cart page

    const cart = getCart();
    const totals = getCartTotals();

    // Render summary
    subtotalEl.innerText = `$${totals.subtotal.toFixed(2)}`;
    taxEl.innerText = `$${totals.tax.toFixed(2)}`;
    shippingEl.innerText = totals.isEmpty ? 'Calculated at checkout' : (totals.shipping === 0 ? 'Free' : `$${totals.shipping.toFixed(2)}`);
    totalEl.innerText = `$${totals.total.toFixed(2)}`;

    // Render items
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="bg-surface-container-lowest/70 backdrop-blur-20px p-10 text-center text-secondary">
                Your bag is currently empty.
                <button onclick="window.location.href='collections.html'" class="block mx-auto mt-6 bg-primary text-white px-6 py-3 text-xs uppercase tracking-widest font-bold">Shop Collections</button>
            </div>
        `;
        return;
    }

    let html = '';
    cart.forEach(item => {
        html += `
        <div class="bg-surface-container-lowest/70 backdrop-blur-20px p-6 flex flex-col sm:flex-row gap-8 transition-all duration-300 group">
            <div class="w-full sm:w-48 aspect-[3/4] overflow-hidden">
                <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${item.image}"/>
            </div>
            <div class="flex flex-col justify-between flex-1 py-2">
                <div>
                    <div class="flex justify-between items-start">
                        <h3 class="noto-serif text-xl font-bold text-primary">${item.name}</h3>
                        <span class="manrope font-semibold text-lg">$${item.price.toFixed(2)}</span>
                    </div>
                    <p class="text-secondary text-sm mt-2 mb-4 tracking-wide uppercase manrope label-md">Size: ${item.size}</p>
                </div>
                <div class="flex justify-between items-end mt-8">
                    <div class="flex items-center border border-outline-variant/15">
                        <button onclick="updateQuantity(${item.id}, -1)" class="px-3 py-1 text-secondary hover:text-primary transition-colors">-</button>
                        <span class="px-4 py-1 text-sm font-semibold">${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)" class="px-3 py-1 text-secondary hover:text-primary transition-colors">+</button>
                    </div>
                    <button onclick="removeFromCart(${item.id})" class="text-xs uppercase tracking-widest text-outline hover:text-error transition-colors flex items-center gap-2">
                        <span class="material-symbols-outlined text-[16px]">close</span> Remove
                    </button>
                </div>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
}

// Auto-render on load
document.addEventListener('DOMContentLoaded', renderCartPage);
