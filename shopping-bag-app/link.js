const fs = require('fs');
const path = require('path');

const files = ['index.html', 'cart.html', 'collections.html', 'flow.html', 'product.html'];

files.forEach(file => {
    let content = fs.readFileSync(path.join(__dirname, file), 'utf-8');

    // Link Logo to index.html
    content = content.replace(/>KINETIC MUSE<\/a>/g, ' href="index.html">KINETIC MUSE</a>');

    // Link Collections navigation to collections.html
    content = content.replace(/>Collections<\/a>/g, ' href="collections.html">Collections</a>');
    
    // Link "Shop New Arrivals" or "Explore All Collections" to collections.html
    content = content.replace(/>\s*Shop New Arrivals\s*<\/a>/g, ' href="collections.html">Shop New Arrivals</a>');
    content = content.replace(/>Explore All Collections<\/a>/g, ' href="collections.html">Explore All Collections</a>');

    // Link Shopping Bag icon to cart.html
    // It's usually a button holding the icon
    content = content.replace(/<button([^>]*)>\s*<span class="material-symbols-outlined"(.*?)shopping_bag(.*?)<\/button>/g, 
        '<button$1 onclick="window.location.href=\'cart.html\'">\n<span class="material-symbols-outlined"$2shopping_bag$3</button>');

    // Link Products (group cursor-pointer) to product.html
    content = content.replace(/class="([^"]*)group cursor-pointer([^"]*)"/g, 'class="$1group cursor-pointer$2" onclick="window.location.href=\'product.html\'"');

    // Link Checkout button to flow.html
    content = content.replace(/>\s*Proceed to Checkout\s*<\/button>/g, ' onclick="window.location.href=\'flow.html\'">Proceed to Checkout</button>');

    fs.writeFileSync(path.join(__dirname, file), content, 'utf-8');
});

console.log('Linking complete!');
