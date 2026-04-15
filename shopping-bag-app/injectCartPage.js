const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.join(__dirname, 'cart.html'), 'utf-8');

// Add id to cart-items-container
content = content.replace(/<div class="lg:col-span-8 space-y-8">/g, '<div id="cart-items-container" class="lg:col-span-8 space-y-8">');

// Add id to subtotal
content = content.replace(/<span class="text-on-surface font-semibold">\$425\.00<\/span>/g, '<span id="cart-subtotal" class="text-on-surface font-semibold">$425.00</span>');

// Add id to shipping
content = content.replace(/<span class="text-on-surface font-semibold">Calculated at checkout<\/span>/g, '<span id="cart-shipping" class="text-on-surface font-semibold">Calculated at checkout</span>');

// Add id to tax
content = content.replace(/<span class="text-on-surface font-semibold">\$34\.00<\/span>/g, '<span id="cart-tax" class="text-on-surface font-semibold">$34.00</span>');

// Add id to total
content = content.replace(/<span class="manrope">\$459\.00<\/span>/g, '<span id="cart-total" class="manrope">$459.00</span>');

// Append renderCart.js script
if (!content.includes('renderCart.js')) {
    content = content.replace(/<script src="cartLogic\.js"><\/script>/g, '<script src="cartLogic.js"></script>\n<script src="renderCart.js"></script>');
}

fs.writeFileSync(path.join(__dirname, 'cart.html'), content, 'utf-8');

console.log('Cart page injected!');
