const fs = require('fs');
const path = require('path');

const files = ['index.html', 'cart.html', 'collections.html', 'flow.html', 'product.html'];

files.forEach(file => {
    let content = fs.readFileSync(path.join(__dirname, file), 'utf-8');

    // 1. Ensure the shopping bag button has the badge globally.
    // The link.js created buttons like:
    // <button class="hover:opacity-80 transition-opacity" onclick="window.location.href='cart.html'">
    // <span class="material-symbols-outlined" data-icon="shopping_bag">shopping_bag</span>
    // </button>
    // We want to force the parent button to have 'relative' class, and inject the badge inside.

    // Regex to find the shopping_bag span, regardless of surrounding button.
    // We'll replace the shopping bag span with the span AND the badge.
    content = content.replace(/<span class="material-symbols-outlined"([^>]*)shopping_bag([^>]*)<\/span>(?![^<]*<span id="cart-badge")/g, 
        '<span class="material-symbols-outlined"$1shopping_bag$2</span>\n<span id="cart-badge" class="absolute -top-1 -right-1 bg-surface-tint text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full" style="display:none;">0</span>');

    // Make sure parent buttons of the icon are relative
    content = content.replace(/<button class="([^"]*hover:opacity-80[^"]*)"/g, (match, classes) => {
        if (!classes.includes('relative')) {
            return `<button class="${classes} relative"`;
        }
        return match;
    });

    // 2. Ensure product.html has the click listener firing. 
    // Is it possible the product button was hijacked by link.js?
    // link.js: content.replace(/class="([^"]*)group cursor-pointer([^"]*)"/g, ... onclick='product.html' ...)
    // Our button was: <button id="add-to-bag" ...>
    // Just to be extremely robust, we will replace the add-to-bag script with an inline onclick:
    // 'onclick="handleAddToBag()"'
    
    fs.writeFileSync(path.join(__dirname, file), content, 'utf-8');
});

// Let's modify product.html specifically to make add-to-bag globally robust
let productHtml = fs.readFileSync(path.join(__dirname, 'product.html'), 'utf-8');
productHtml = productHtml.replace(/<button id="add-to-bag"([^>]*)>/, '<button id="add-to-bag"$1 onclick="window.handleAddToBag()">');

// Add global handleAddToBag function to cartLogic.js
let cartLogic = fs.readFileSync(path.join(__dirname, 'cartLogic.js'), 'utf-8');
if (!cartLogic.includes('window.handleAddToBag')) {
    cartLogic += `\n
window.handleAddToBag = function() {
    console.log("Adding to bag!");
    const addBtn = document.getElementById('add-to-bag');
    const product = {
        name: 'AER-FLUX COMPRESSION LEGGING',
        price: 145.00,
        size: 'S',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCU6nqxm0ipJHzLGphcws6bsRwd-5yqhYKEEZPzgg7JjwVOQEczXhgnM5bhI8ioTbYnLCO1pvMTruqWnVM4JfxYIStxLAXjgXumPgBnZ0-XPMAkWn1koXjEFwYSPpeg_A344Sxk5XWOhPcYq97TNDqGv-V4HmrUmGmhLclk69Z8Bv5S0wNC2UoDE26eAns7V6vwhSvSNYpzHR31b7eN3HzydiECcchIjYfm6N7CrXdMoG0tosJF_0vi1YZpKIwqIrq05voOEna6Kkw'
    };
    addToCart(product);
    if (addBtn) {
        const originalText = addBtn.innerText;
        addBtn.innerText = 'ADDED TO BAG!';
        addBtn.classList.add('bg-secondary');
        setTimeout(() => {
            addBtn.innerText = originalText;
            addBtn.classList.remove('bg-secondary');
        }, 2000);
    }
};
`;
    fs.writeFileSync(path.join(__dirname, 'cartLogic.js'), cartLogic, 'utf-8');
}

fs.writeFileSync(path.join(__dirname, 'product.html'), productHtml, 'utf-8');

console.log('superFix complete!');
