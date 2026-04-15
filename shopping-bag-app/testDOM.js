const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const productHtml = fs.readFileSync('product.html', 'utf8');
const cartLogic = fs.readFileSync('cartLogic.js', 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("log", (msg) => { console.log("LOG:", msg); });
virtualConsole.on("jsdomError", (e) => { console.error("JSDOM ERROR:", e); });
virtualConsole.on("error", (e) => { console.error("ERROR:", e); });

const dom = new JSDOM(productHtml, { 
    runScripts: "dangerously", 
    virtualConsole 
});

// Mock localStorage
const localStorageMock = {
  getItem: jestFn = (k) => dom.window.localStorageData[k] || null,
  setItem: jestFn2 = (k,v) => dom.window.localStorageData[k] = v,
  clear: jestFn3 = () => dom.window.localStorageData = {}
};
dom.window.localStorageData = {};
Object.defineProperty(dom.window, 'localStorage', { value: localStorageMock });

const scriptEl = dom.window.document.createElement('script');
scriptEl.textContent = cartLogic;
dom.window.document.body.appendChild(scriptEl);

// Wait a bit to let scripts parse and DOMContentLoaded fire
setTimeout(() => {
    // Fire DOMContentLoaded manually since JSDOM might have already fired it before we injected script
    const event = dom.window.document.createEvent('Event');
    event.initEvent('DOMContentLoaded', true, true);
    dom.window.document.dispatchEvent(event);

    try {
        console.log("Simulating click on Add To Bag...");
        const btn = dom.window.document.getElementById('add-to-bag');
        if(!btn) console.log("Button not found!");
        btn.click();
        
        console.log("Cart contents:", dom.window.localStorageData['kinetic_muse_cart']);
        console.log("Badge text:", dom.window.document.getElementById('cart-badge').innerText);
        console.log("Button text:", btn.innerText);
    } catch(err) {
        console.error("RUNTIME ERROR CATCHED:", err);
    }
}, 500);
