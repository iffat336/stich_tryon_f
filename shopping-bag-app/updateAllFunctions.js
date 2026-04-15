const fs = require('fs');
const path = require('path');

const files = ['index.html', 'cart.html', 'collections.html', 'product.html', 'flow.html'];

// 1. We will update cartLogic.js to include global Quick Add function and size selector.
let cartLogic = fs.readFileSync(path.join(__dirname, 'cartLogic.js'), 'utf-8');

if (!cartLogic.includes('window.handleQuickAdd')) {
    const newFns = `
window.handleQuickAdd = function(event, name, price, image) {
    event.preventDefault(); // Stop from navigating to product page
    event.stopPropagation();
    
    console.log("Quick adding: ", name);
    const product = {
        name: name,
        price: parseFloat(price),
        size: 'O/S', // One-Size for quick adds
        image: image
    };
    addToCart(product);
    
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
    // Try to extract name and price from DOM
    const nameEl = document.querySelector('h1.noto-serif');
    const priceEl = document.querySelector('p.text-secondary.tracking-wide');
    const imgEl = document.querySelector('.lg\\\\:col-span-7 img');
    
    const product = {
        name: nameEl ? nameEl.innerText : 'KINETIC APPAREL',
        price: priceEl ? parseFloat(priceEl.innerText.replace(/[^0-9.]/g, '')) : 145.00,
        size: window.selectedSize,
        image: imgEl ? imgEl.src : 'https://placehold.co/400x500/000000/FFF?text=KINETIC'
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

    // Replace the old handleAddToBag with handleDynamicAddToBag inside the cartLogic
    cartLogic = cartLogic.replace(/window\.handleAddToBag = function\(\) \{[\s\S]*?\};\n/m, '');
    cartLogic += newFns;
    fs.writeFileSync(path.join(__dirname, 'cartLogic.js'), cartLogic, 'utf-8');
}

// 2. Process all HTML files to patch Quick Adds and size buttons
files.forEach(file => {
    let content = fs.readFileSync(path.join(__dirname, file), 'utf-8');

    // Make size buttons clickable
    if (file === 'product.html') {
        content = content.replace(/<button class="py-3 text-xs manrope font-medium bg-surface-container-lowest border border-outline-variant\/15 hover:border-primary transition-all">/g, 
            '<button onclick="window.handleSizeSelect(event)" class="size-btn py-3 text-xs manrope font-medium bg-surface-container-lowest border border-outline-variant/15 hover:border-primary transition-all">');
        
        content = content.replace(/<button class="py-3 text-xs manrope font-bold bg-primary text-white border border-primary">/g, 
            '<button onclick="window.handleSizeSelect(event)" class="size-btn py-3 text-xs manrope font-bold bg-primary text-white border border-primary">');
            
        content = content.replace(/onclick="window.handleAddToBag\(\)"/g, 'onclick="window.handleDynamicAddToBag()"');
    }

    // Now let's find all Quick Add buttons and extract the product data surrounding them.
    // The structure typically is:
    // <div class="group cursor-pointer"...>
    //   <img src="URL"...>
    //   ... <button ...>Quick Add +</button>
    //   <h4 ...>NAME</h4>
    //   <p ...>$PRICE</p>
    // </div>
    
    // We will use a regex to inject onclick into the Quick Add + button, but since JS regex across many lines is fragile, we'll do it via DOM injection inside the HTML as a script!
    // Safest way is an inline script that finds all Quick Add buttons.
    const quickAddScript = `
<script>
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('button').forEach(btn => {
        if(btn.innerText.includes('Quick Add +')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Find parent container
                const card = btn.closest('.group');
                if(!card) return;
                const nameEl = card.querySelector('h4, h5');
                const priceEl = card.querySelector('p');
                const imgEl = card.querySelector('img');
                
                const name = nameEl ? nameEl.innerText : 'KINETIC ITEM';
                const price = priceEl ? parseFloat(priceEl.innerText.replace(/[^0-9.]/g, '')) : 100.00;
                const image = imgEl ? imgEl.src : '';
                
                window.handleQuickAdd(e, name, price, image);
            });
        }
    });
});
</script>
`;
    if (!content.includes('Quick Add +')) {
        // do nothing
    } else if (!content.includes('window.handleQuickAdd(')) {
        content = content.replace('</body>', quickAddScript + '</body>');
    }

    // There are also the plus sign Quick Adds on the Home Page and Product page 'Complete The Look' sections:
    // <span class="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity" data-icon="add">add</span>
    const plusAddScript = `
<script>
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('span[data-icon="add"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const card = btn.closest('.group');
            if(!card) return;
            const nameEl = card.querySelector('h4, h5');
            const priceEl = card.querySelector('p');
            const imgEl = card.querySelector('img');
            
            const name = nameEl ? nameEl.innerText : 'KINETIC ITEM';
            const price = priceEl ? parseFloat(priceEl.innerText.replace(/[^0-9.]/g, '')) : 100.00;
            const image = imgEl ? imgEl.src : '';
            
            window.handleQuickAdd(e, name, price, image);
        });
    });
});
</script>
`;
    if (content.includes('data-icon="add"') && !content.includes('span[data-icon="add"]')) {
        content = content.replace('</body>', plusAddScript + '</body>');
    }

    fs.writeFileSync(path.join(__dirname, file), content, 'utf-8');
});

console.log('Functions updated!');
