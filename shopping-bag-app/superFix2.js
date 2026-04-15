const fs = require('fs');
const path = require('path');

const files = ['index.html', 'cart.html', 'collections.html', 'flow.html', 'product.html'];

files.forEach(file => {
    let content = fs.readFileSync(path.join(__dirname, file), 'utf-8');

    // Make sure we have the cart badge next to the shopping_bag icon in every file EXCEPT cart.html if it already has it.
    // If we look at the exact pattern in stitched HTML:
    // <span class="material-symbols-outlined" data-icon="shopping_bag">shopping_bag</span>
    // Sometimes it has other classes. We can simply replace `>shopping_bag</span>` literally!
    // But we only want to inject it once!

    // First remove any existing cart badges to be safe and avoid duplicates.
    content = content.replace(/<span id="cart-badge"[\s\S]*?<\/span>/g, '');
    
    // Now just inject it right after the shopping_bag span closes!
    content = content.replace(
        /(>shopping_bag<\/span>)/g, 
        '$1\n<span id="cart-badge" class="absolute -top-1 -right-1 bg-surface-tint text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full" style="display:none;">0</span>'
    );

    fs.writeFileSync(path.join(__dirname, file), content, 'utf-8');
});

console.log('Badge injection complete!');
