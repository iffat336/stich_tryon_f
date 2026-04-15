// Simple Virtual Try-On System

let avatar = null;
let selectedSizeForCart = 'M';

function createSimpleAvatar(chest, height, bodyType, product) {
    const svg = document.getElementById('avatar-svg');
    if (!svg) {
        console.error('SVG element not found');
        return;
    }

    // Clear SVG
    while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }

    const centerX = 150;
    const headY = 60;
    const bodyY = 110;

    // Head - skin tone
    const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    head.setAttribute('cx', centerX);
    head.setAttribute('cy', headY);
    head.setAttribute('r', '30');
    head.setAttribute('fill', '#f5a399');
    svg.appendChild(head);

    // Eyes
    const eye1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    eye1.setAttribute('cx', centerX - 12);
    eye1.setAttribute('cy', headY - 5);
    eye1.setAttribute('r', '3');
    eye1.setAttribute('fill', '#333');
    svg.appendChild(eye1);

    const eye2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    eye2.setAttribute('cx', centerX + 12);
    eye2.setAttribute('cy', headY - 5);
    eye2.setAttribute('r', '3');
    eye2.setAttribute('fill', '#333');
    svg.appendChild(eye2);

    // Mouth
    const mouth = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    mouth.setAttribute('d', `M ${centerX - 8} ${headY + 10} Q ${centerX} ${headY + 15} ${centerX + 8} ${headY + 10}`);
    mouth.setAttribute('stroke', '#d4a89a');
    mouth.setAttribute('stroke-width', '2');
    mouth.setAttribute('fill', 'none');
    mouth.setAttribute('stroke-linecap', 'round');
    svg.appendChild(mouth);

    // Neck
    const neck = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    neck.setAttribute('x', centerX - 5);
    neck.setAttribute('y', headY + 28);
    neck.setAttribute('width', '10');
    neck.setAttribute('height', '15');
    neck.setAttribute('fill', '#f5a399');
    svg.appendChild(neck);

    // Calculate body width based on chest
    const chestRatio = chest / 36;
    let bodyWidth = 50 * chestRatio;
    
    if (bodyType === 'slim') bodyWidth *= 0.85;
    if (bodyType === 'curvy') bodyWidth *= 1.2;

    // Body/Clothing
    if (product === 'kurta') {
        const kurta = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const kurtaHeight = 140;
        const bottomWidth = bodyWidth * 1.15;
        
        kurta.setAttribute('d', `
            M ${centerX - bodyWidth/2} ${bodyY}
            L ${centerX - bottomWidth/2} ${bodyY + kurtaHeight}
            L ${centerX + bottomWidth/2} ${bodyY + kurtaHeight}
            L ${centerX + bodyWidth/2} ${bodyY}
            Z
        `);
        kurta.setAttribute('fill', '#2d5016');
        kurta.setAttribute('stroke', '#1a3009');
        kurta.setAttribute('stroke-width', '1.5');
        svg.appendChild(kurta);

        // Gold embroidery details
        const emb1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        emb1.setAttribute('cx', centerX - 15);
        emb1.setAttribute('cy', bodyY + 20);
        emb1.setAttribute('r', '2');
        emb1.setAttribute('fill', '#d4af37');
        svg.appendChild(emb1);

        const emb2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        emb2.setAttribute('cx', centerX + 15);
        emb2.setAttribute('cy', bodyY + 20);
        emb2.setAttribute('r', '2');
        emb2.setAttribute('fill', '#d4af37');
        svg.appendChild(emb2);
    } else if (product === 'shirt') {
        const shirt = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const shirtHeight = 100;
        const waistWidth = bodyWidth * 0.9;
        
        shirt.setAttribute('d', `
            M ${centerX - bodyWidth/2} ${bodyY}
            L ${centerX - waistWidth/2} ${bodyY + shirtHeight}
            L ${centerX + waistWidth/2} ${bodyY + shirtHeight}
            L ${centerX + bodyWidth/2} ${bodyY}
            Z
        `);
        shirt.setAttribute('fill', '#ffffff');
        shirt.setAttribute('stroke', '#d4a89a');
        shirt.setAttribute('stroke-width', '1.5');
        svg.appendChild(shirt);

        // Buttons
        for (let i = 0; i < 5; i++) {
            const btn = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            btn.setAttribute('cx', centerX);
            btn.setAttribute('cy', bodyY + 10 + i * 15);
            btn.setAttribute('r', '2.5');
            btn.setAttribute('fill', '#999');
            svg.appendChild(btn);
        }
    }

    // Legs
    const leg1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    leg1.setAttribute('x', centerX - 10);
    leg1.setAttribute('y', bodyY + (product === 'kurta' ? 140 : 100));
    leg1.setAttribute('width', '12');
    leg1.setAttribute('height', '100');
    leg1.setAttribute('fill', '#f5a399');
    svg.appendChild(leg1);

    const leg2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    leg2.setAttribute('x', centerX + 8);
    leg2.setAttribute('y', bodyY + (product === 'kurta' ? 140 : 100));
    leg2.setAttribute('width', '12');
    leg2.setAttribute('height', '100');
    leg2.setAttribute('fill', '#f5a399');
    svg.appendChild(leg2);

    // Feet
    const foot1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    foot1.setAttribute('x', centerX - 12);
    foot1.setAttribute('y', bodyY + (product === 'kurta' ? 240 : 200));
    foot1.setAttribute('width', '20');
    foot1.setAttribute('height', '8');
    foot1.setAttribute('rx', '4');
    foot1.setAttribute('fill', '#333');
    svg.appendChild(foot1);

    const foot2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    foot2.setAttribute('x', centerX + 8);
    foot2.setAttribute('y', bodyY + (product === 'kurta' ? 240 : 200));
    foot2.setAttribute('width', '20');
    foot2.setAttribute('height', '8');
    foot2.setAttribute('rx', '4');
    foot2.setAttribute('fill', '#333');
    svg.appendChild(foot2);

    console.log(`Avatar rendered: chest=${chest}, height=${height}, type=${bodyType}, product=${product}`);
}

function updateAvatar() {
    const chest = parseFloat(document.getElementById('chest-input').value);
    const height = parseFloat(document.getElementById('height-input').value);
    const bodyType = document.querySelector('input[name="body-type"]:checked')?.value || 'average';
    const product = document.querySelector('input[name="product-type"]:checked')?.value || 'kurta';
    
    createSimpleAvatar(chest, height, bodyType, product);
    updateSizeRecommendation(chest);
    updateSizeComparison();
}

function updateSizeRecommendation(chest) {
    let size = 'M';
    if (chest <= 32) size = 'XS';
    else if (chest <= 36) size = 'S';
    else if (chest <= 40) size = 'M';
    else if (chest <= 44) size = 'L';
    else size = 'XL';
    
    document.getElementById('recommended-size').innerText = size;
    document.getElementById('rec-chest').innerText = Math.round(chest);
    selectedSizeForCart = size;
}

function updateSizeComparison() {
    const container = document.getElementById('size-comparison');
    container.innerHTML = '';
    
    const sizes = ['XS', 'S', 'M', 'L'];
    const selectedSize = selectedSizeForCart;
    
    sizes.forEach(size => {
        const div = document.createElement('div');
        div.className = 'size-preview' + (size === selectedSize ? ' active' : '');
        
        const label = document.createElement('span');
        label.className = 'manrope text-xs font-bold mt-2 block';
        label.innerText = size;
        
        div.appendChild(label);
        
        div.addEventListener('click', () => {
            document.querySelectorAll('.size-preview').forEach(p => p.classList.remove('active'));
            div.classList.add('active');
            selectedSizeForCart = size;
        });
        
        container.appendChild(div);
    });
}

function addRecommendedToCart() {
    const product = document.querySelector('input[name="product-type"]:checked')?.value || 'kurta';
    const item = {
        name: `KINETIC ${product.toUpperCase()}`,
        price: 189.99,
        size: selectedSizeForCart,
        image: 'https://placehold.co/400x500/000000/FFF?text=KINETIC'
    };
    
    window.addToCart(item);
    
    const btn = document.querySelector('button[onclick="addRecommendedToCart()"]');
    const originalText = btn.innerText;
    btn.innerText = '✓ ADDED!';
    btn.style.background = '#4caf50';
    
    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.background = '';
    }, 2000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Try-On page loaded');
    
    window.updateCartBadges();
    
    // Initial avatar render
    createSimpleAvatar(36, 66, 'average', 'kurta');
    updateSizeRecommendation(36);
    updateSizeComparison();
    
    // Chest input
    document.getElementById('chest-input').addEventListener('input', updateAvatar);
    
    // Height input
    document.getElementById('height-input').addEventListener('input', updateAvatar);
    
    // Waist input
    document.getElementById('waist-input').addEventListener('input', updateAvatar);
    
    // Body type
    document.querySelectorAll('input[name="body-type"]').forEach(radio => {
        radio.addEventListener('change', updateAvatar);
    });
    
    // Product type
    document.querySelectorAll('input[name="product-type"]').forEach(radio => {
        radio.addEventListener('change', updateAvatar);
    });
});
