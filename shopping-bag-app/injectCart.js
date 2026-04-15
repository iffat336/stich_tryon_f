const fs = require('fs');
const path = require('path');

const files = ['index.html', 'cart.html', 'collections.html', 'flow.html', 'product.html'];

files.forEach(file => {
    let content = fs.readFileSync(path.join(__dirname, file), 'utf-8');

    // Add script tag before </body>
    if (!content.includes('cartLogic.js')) {
        content = content.replace(/<\/body>/g, '<script src="cartLogic.js"></script>\n</body>');
    }

    // Add id to cart badges
    // Sometimes it has "2", sometimes empty, let's just replace the exact span opening tag.
    // `<span class="absolute -top-1 -right-1 bg-surface-tint text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">`
    content = content.replace(/<span class="absolute -top-1 -right-1 bg-surface-tint text-white text-\[10px\] w-4 h-4 flex items-center justify-center rounded-full">/g, 
        '<span id="cart-badge" class="absolute -top-1 -right-1 bg-surface-tint text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">');

    fs.writeFileSync(path.join(__dirname, file), content, 'utf-8');
});

console.log('Injection complete!');
