// Virtual Try-On JavaScript

class AvatarRenderer {
    constructor(svgElement) {
        this.svg = svgElement;
        this.chest = 36;
        this.height = 66;
        this.waist = 32;
        this.bodyType = 'average';
        this.product = 'kurta';
        this.selectedSize = 'M';
    }

    updateMeasurements(chest, height, waist) {
        this.chest = parseFloat(chest);
        this.height = parseFloat(height);
        this.waist = parseFloat(waist);
        this.render();
    }

    updateBodyType(type) {
        this.bodyType = type;
        this.render();
    }

    updateProduct(product) {
        this.product = product;
        this.render();
    }

    selectSize(size) {
        this.selectedSize = size;
        this.render();
    }

    getSizeClass() {
        if (this.chest <= 32) return 'XS';
        if (this.chest <= 36) return 'S';
        if (this.chest <= 40) return 'M';
        if (this.chest <= 44) return 'L';
        return 'XL';
    }

    getBodyDimensions() {
        const heightRatio = this.height / 66; // Use 66" as base
        const chestRatio = this.chest / 36;
        
        let bodyWidth = 60;
        let bodyHeight = 80;
        
        // Apply body type multipliers
        if (this.bodyType === 'slim') {
            bodyWidth *= 0.8;
        } else if (this.bodyType === 'curvy') {
            bodyWidth *= 1.2;
        }
        
        bodyWidth *= chestRatio;
        bodyHeight *= heightRatio;

        return {
            width: Math.max(40, Math.min(100, bodyWidth)),
            height: Math.max(60, Math.min(150, bodyHeight)),
            waistRatio: this.waist / this.chest
        };
    }

    renderAvatar() {
        this.svg.innerHTML = '';
        const dims = this.getBodyDimensions();

        // Background gradient
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'bodyGradient');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#fdbcb4');
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#f5a399');
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        this.svg.appendChild(defs);

        // Head
        const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        head.setAttribute('cx', '150');
        head.setAttribute('cy', '70');
        head.setAttribute('r', '30');
        head.setAttribute('fill', '#f5a399');
        this.svg.appendChild(head);

        // Eyes
        const eye1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        eye1.setAttribute('cx', '140');
        eye1.setAttribute('cy', '65');
        eye1.setAttribute('r', '3');
        eye1.setAttribute('fill', '#333');
        this.svg.appendChild(eye1);

        const eye2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        eye2.setAttribute('cx', '160');
        eye2.setAttribute('cy', '65');
        eye2.setAttribute('r', '3');
        eye2.setAttribute('fill', '#333');
        this.svg.appendChild(eye2);

        // Mouth
        const mouth = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        mouth.setAttribute('d', 'M 140 80 Q 150 85 160 80');
        mouth.setAttribute('stroke', '#c98880');
        mouth.setAttribute('stroke-width', '2');
        mouth.setAttribute('fill', 'none');
        this.svg.appendChild(mouth);

        // Neck
        const neck = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        neck.setAttribute('x', '145');
        neck.setAttribute('y', '100');
        neck.setAttribute('width', '10');
        neck.setAttribute('height', '15');
        neck.setAttribute('fill', '#f5a399');
        this.svg.appendChild(neck);

        // Render clothing
        this.renderClothing(dims);

        // Legs (if visible)
        if (this.product !== 'leggings') {
            const leg1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            leg1.setAttribute('x', '135');
            leg1.setAttribute('y', '280');
            leg1.setAttribute('width', '15');
            leg1.setAttribute('height', '100');
            leg1.setAttribute('fill', '#f5a399');
            this.svg.appendChild(leg1);

            const leg2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            leg2.setAttribute('x', '150');
            leg2.setAttribute('y', '280');
            leg2.setAttribute('width', '15');
            leg2.setAttribute('height', '100');
            leg2.setAttribute('fill', '#f5a399');
            this.svg.appendChild(leg2);
        } else {
            // Leggings
            const legging1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            legging1.setAttribute('x', '135');
            legging1.setAttribute('y', '280');
            legging1.setAttribute('width', '15');
            legging1.setAttribute('height', '100');
            legging1.setAttribute('fill', '#1a1a1a');
            this.svg.appendChild(legging1);

            const legging2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            legging2.setAttribute('x', '150');
            legging2.setAttribute('y', '280');
            legging2.setAttribute('width', '15');
            legging2.setAttribute('height', '100');
            legging2.setAttribute('fill', '#1a1a1a');
            this.svg.appendChild(legging2);
        }

        // Feet
        const foot1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        foot1.setAttribute('x', '130');
        foot1.setAttribute('y', '380');
        foot1.setAttribute('width', '25');
        foot1.setAttribute('height', '10');
        foot1.setAttribute('rx', '5');
        foot1.setAttribute('fill', '#333');
        this.svg.appendChild(foot1);

        const foot2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        foot2.setAttribute('x', '145');
        foot2.setAttribute('y', '380');
        foot2.setAttribute('width', '25');
        foot2.setAttribute('height', '10');
        foot2.setAttribute('rx', '5');
        foot2.setAttribute('fill', '#333');
        this.svg.appendChild(foot2);
    }

    renderClothing(dims) {
        const centerX = 150;
        const clothingY = 115;
        const clothingWidth = dims.width;
        const waistWidth = clothingWidth * dims.waistRatio;

        if (this.product === 'kurta') {
            // Kurta - longer tunic style
            const kurta = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const topWidth = clothingWidth;
            const bottomWidth = clothingWidth * 1.1;
            const kurtaHeight = 140;
            
            kurta.setAttribute('d', `
                M ${centerX - topWidth/2} ${clothingY}
                L ${centerX - bottomWidth/2} ${clothingY + kurtaHeight}
                L ${centerX + bottomWidth/2} ${clothingY + kurtaHeight}
                L ${centerX + topWidth/2} ${clothingY}
                Z
            `);
            kurta.setAttribute('fill', '#e8c4b8');
            kurta.setAttribute('stroke', '#d4a89a');
            kurta.setAttribute('stroke-width', '1');
            this.svg.appendChild(kurta);

            // Kurta neckline
            const neckline = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            neckline.setAttribute('cx', `${centerX}`);
            neckline.setAttribute('cy', `${clothingY}`);
            neckline.setAttribute('rx', '8');
            neckline.setAttribute('ry', '10');
            neckline.setAttribute('fill', '#f5a399');
            this.svg.appendChild(neckline);

        } else if (this.product === 'shirt') {
            // Shirt - fitted design
            const shirt = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const shirtHeight = 80;
            
            shirt.setAttribute('d', `
                M ${centerX - clothingWidth/2} ${clothingY}
                L ${centerX - waistWidth/2} ${clothingY + shirtHeight}
                L ${centerX + waistWidth/2} ${clothingY + shirtHeight}
                L ${centerX + clothingWidth/2} ${clothingY}
                Z
            `);
            shirt.setAttribute('fill', '#fff');
            shirt.setAttribute('stroke', '#ddd');
            shirt.setAttribute('stroke-width', '1');
            this.svg.appendChild(shirt);

            // Shirt buttons
            for (let i = 0; i < 4; i++) {
                const button = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                button.setAttribute('cx', '150');
                button.setAttribute('cy', `${clothingY + 20 + i * 15}`);
                button.setAttribute('r', '2.5');
                button.setAttribute('fill', '#999');
                this.svg.appendChild(button);
            }

        } else if (this.product === 'leggings') {
            // Leggings render in leg section
        }
    }

    render() {
        this.renderAvatar();
    }
}

// Initialize
let avatar;
let selectedSizeForCart = 'M';

document.addEventListener('DOMContentLoaded', function() {
    const svgElement = document.getElementById('avatar-svg');
    avatar = new AvatarRenderer(svgElement);
    avatar.render();
    
    window.updateCartBadges();
    updateSizeComparison();

    // Chest input
    document.getElementById('chest-input').addEventListener('input', function() {
        const val = this.value;
        avatar.updateMeasurements(val, avatar.height, avatar.waist);
        document.getElementById('chest-display').innerText = val + '"';
        updateSizeRecommendation();
        updateSizeComparison();
    });

    // Height input
    document.getElementById('height-input').addEventListener('input', function() {
        const val = this.value;
        avatar.updateMeasurements(avatar.chest, val, avatar.waist);
        document.getElementById('height-display').innerText = val + '"';
        updateSizeComparison();
    });

    // Waist input
    document.getElementById('waist-input').addEventListener('input', function() {
        const val = this.value;
        avatar.updateMeasurements(avatar.chest, avatar.height, val);
        document.getElementById('waist-display').innerText = val + '"';
        updateSizeComparison();
    });

    // Body type radio buttons
    document.querySelectorAll('input[name="body-type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            avatar.updateBodyType(this.value);
            updateSizeComparison();
        });
    });

    // Product type radio buttons
    document.querySelectorAll('input[name="product-type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            avatar.updateProduct(this.value);
            updateSizeComparison();
        });
    });

    updateSizeRecommendation();
});

function updateSizeRecommendation() {
    const size = avatar.getSizeClass();
    document.getElementById('recommended-size').innerText = size;
    document.getElementById('rec-chest').innerText = Math.round(avatar.chest);
    selectedSizeForCart = size;
}

function updateSizeComparison() {
    const container = document.getElementById('size-comparison');
    container.innerHTML = '';
    
    const sizes = ['XS', 'S', 'M', 'L'];
    
    sizes.forEach(size => {
        const preview = document.createElement('div');
        preview.className = 'size-preview' + (size === avatar.selectedSize ? ' active' : '');
        
        // Create mini clone with different chest
        let miniChest = avatar.chest;
        if (size === 'XS') miniChest = 30;
        else if (size === 'S') miniChest = 34;
        else if (size === 'M') miniChest = 38;
        else if (size === 'L') miniChest = 42;
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 300 500');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        // Simple mini avatar
        const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        head.setAttribute('cx', '150');
        head.setAttribute('cy', '50');
        head.setAttribute('r', '15');
        head.setAttribute('fill', '#f5a399');
        svg.appendChild(head);
        
        // Body
        const bodyWidth = 30 + (miniChest - 30) * 0.5;
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        body.setAttribute('x', `${150 - bodyWidth/2}`);
        body.setAttribute('y', '70');
        body.setAttribute('width', `${bodyWidth}`);
        body.setAttribute('height', '60');
        body.setAttribute('rx', '3');
        body.setAttribute('fill', '#e8c4b8');
        svg.appendChild(body);
        
        // Legs
        const leg1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        leg1.setAttribute('x', '140');
        leg1.setAttribute('y', '130');
        leg1.setAttribute('width', '8');
        leg1.setAttribute('height', '50');
        leg1.setAttribute('fill', '#f5a399');
        svg.appendChild(leg1);
        
        const leg2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        leg2.setAttribute('x', '152');
        leg2.setAttribute('y', '130');
        leg2.setAttribute('width', '8');
        leg2.setAttribute('height', '50');
        leg2.setAttribute('fill', '#f5a399');
        svg.appendChild(leg2);
        
        preview.appendChild(svg);
        
        const label = document.createElement('div');
        label.className = 'manrope text-xs font-bold mt-2';
        label.innerText = size;
        preview.appendChild(label);
        
        preview.addEventListener('click', () => {
            document.querySelectorAll('.size-preview').forEach(p => p.classList.remove('active'));
            preview.classList.add('active');
            selectedSizeForCart = size;
        });
        
        container.appendChild(preview);
    });
}

function addRecommendedToCart() {
    const product = {
        name: `KINETIC PREMIUM ${avatar.product.toUpperCase()}`,
        price: 149.99,
        size: selectedSizeForCart,
        image: 'https://placehold.co/400x500/000000/FFF?text=KINETIC+' + avatar.product.toUpperCase(),
        customizations: {
            chest: Math.round(avatar.chest),
            height: Math.round(avatar.height),
            waist: Math.round(avatar.waist),
            bodyType: avatar.bodyType,
            productType: avatar.product
        }
    };
    
    window.addToCart(product);
    
    // Show confirmation
    const btn = document.querySelector('button[onclick="addRecommendedToCart()"]');
    const originalText = btn.innerText;
    btn.innerText = '✓ ADDED TO CART!';
    btn.classList.add('bg-green-600');
    
    setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('bg-green-600');
    }, 2000);
    
    console.log('Added to cart:', product);
}
