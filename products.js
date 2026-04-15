/**
 * KINETIC MUSE - Active Product Catalog
 * Athletic products with structured merchandising metadata
 */

function createProduct(product) {
  return {
    category: 'athletic',
    badge: '',
    line: 'Kinetic Core',
    activity: 'Training',
    silhouette: 'Performance essential',
    fitProfile: 'Regular performance fit',
    supportLevel: 'Medium support',
    composition: '',
    bestFor: ['Studio', 'Training'],
    story: '',
    ...product
  };
}

const PRODUCT_CATALOG = [
  createProduct({
    id: 1,
    slug: 'apex-sculpt-7-8-legging',
    name: 'Apex Sculpt 7/8 Legging',
    subcategory: 'leggings',
    line: 'Apex Sculpt',
    badge: 'Best Seller',
    price: 128,
    originalPrice: 148,
    image: 'https://images.pexels.com/photos/5012029/pexels-photo-5012029.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.8,
    reviews: 324,
    color: 'Obsidian Black',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'AeroFlex interlock',
    composition: '68% recycled nylon, 32% elastane',
    activity: 'Strength / HIIT',
    silhouette: 'High-rise 7/8 legging',
    fitProfile: 'High-compression sculpt fit',
    supportLevel: 'High hold',
    description: 'High-rise training legging with sculpting compression, a locked-in waistband, and a clean matte finish built for hard studio sessions.',
    features: [
      'High-rise waistband',
      'Sculpting compression',
      'Sweat-wicking finish',
      'Phone pocket',
      'No-slip ankle length'
    ],
    bestFor: ['Strength sessions', 'HIIT classes', 'Daily commute'],
    care: 'Machine wash cold, line dry, do not bleach',
    stock: 18,
    story: 'Designed for athletes who want a sharper silhouette without losing mobility through the hip and knee.'
  }),
  createProduct({
    id: 3,
    slug: 'atmos-run-shell',
    name: 'Atmos Run Shell',
    subcategory: 'jackets',
    line: 'Atmos',
    badge: 'New Drop',
    price: 196,
    originalPrice: 196,
    image: 'https://images.pexels.com/photos/14313014/pexels-photo-14313014.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.6,
    reviews: 189,
    color: 'Lunar Grey',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'FeatherShield shell',
    composition: '100% ripstop nylon shell',
    activity: 'Run / Commute',
    silhouette: 'Ultralight zip shell',
    fitProfile: 'Easy layering fit',
    supportLevel: 'Weather-ready shell',
    description: 'A lightweight running shell with vented paneling, packable construction, and a matte silver tone that feels sharp on and off the route.',
    features: [
      'Packable hood',
      'Reflective piping',
      'Back vent panel',
      'Water-repellent shell',
      'Zip hand pockets'
    ],
    bestFor: ['Outdoor runs', 'Travel', 'Layering'],
    care: 'Machine wash cold, zip closed, tumble dry low',
    stock: 12,
    story: 'Built to sit lightly over bras, tanks, and half-zips without creating bulk through the shoulder.'
  }),
  createProduct({
    id: 4,
    slug: 'studioform-longline-layer',
    name: 'StudioForm Longline Layer',
    subcategory: 'tops',
    line: 'StudioForm',
    badge: 'Editor Pick',
    price: 158,
    originalPrice: 184,
    image: 'https://images.pexels.com/photos/8499273/pexels-photo-8499273.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.8,
    reviews: 203,
    color: 'Sage Mist',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'SoftForm rib jersey',
    composition: '81% recycled polyester, 19% elastane',
    activity: 'Pilates / Studio',
    silhouette: 'Longline fitted layer',
    fitProfile: 'Body-skimming studio fit',
    supportLevel: 'Light structure',
    description: 'A longline performance top with a smooth rib face, thumb loops, and enough hold to wear solo or under outer layers.',
    features: [
      'Longline hem',
      'Thumb loops',
      'Soft brushed interior',
      'Quick-dry knit',
      'Low-bulk seams'
    ],
    bestFor: ['Pilates', 'Barre', 'Layering'],
    care: 'Machine wash cold, tumble dry low',
    stock: 20,
    story: 'Made for slower movement days where polish matters as much as comfort and stretch.'
  }),
  createProduct({
    id: 5,
    slug: 'drift-split-short',
    name: 'Drift Split Short',
    subcategory: 'shorts',
    line: 'Drift',
    badge: 'Lightweight',
    price: 68,
    originalPrice: 82,
    image: 'https://images.pexels.com/photos/12223359/pexels-photo-12223359.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.8,
    reviews: 412,
    color: 'Oatmeal',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'AeroKnit mesh',
    composition: '88% recycled nylon, 12% elastane',
    activity: 'Run / Recovery',
    silhouette: 'Split-hem training short',
    fitProfile: 'Relaxed over-short fit',
    supportLevel: 'Breathable light hold',
    description: 'A light split-hem short with an easy top layer, soft liner, and airy drape made for faster sessions and hot weather training.',
    features: [
      'Split side hem',
      'Built-in liner',
      'Zip key pocket',
      'Lightweight waistband',
      'Quick-dry fabric'
    ],
    bestFor: ['Warm weather runs', 'Intervals', 'Recovery walks'],
    care: 'Machine wash cold, air dry',
    stock: 26,
    story: 'The cut is intentionally clean and slightly athletic so it reads polished instead of overly baggy.'
  }),
  createProduct({
    id: 6,
    slug: 'pulse-seamless-tank',
    name: 'Pulse Seamless Tank',
    subcategory: 'tops',
    line: 'Pulse',
    badge: 'Core Layer',
    price: 74,
    originalPrice: 88,
    image: 'https://images.pexels.com/photos/5310743/pexels-photo-5310743.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.7,
    reviews: 178,
    color: 'Cloud White',
    sizes: ['XS', 'S', 'M', 'L'],
    fabric: 'Seamless contour knit',
    composition: '63% nylon, 30% recycled polyester, 7% elastane',
    activity: 'Studio / Layering',
    silhouette: 'Seamless fitted tank',
    fitProfile: 'Second-skin fit',
    supportLevel: 'Light support',
    description: 'A soft seamless tank with body-mapped ventilation, sculpted side texture, and a smooth neckline for daily studio wear.',
    features: [
      'Seamless construction',
      'Body-mapped ventilation',
      'Soft hand feel',
      'Curved hem',
      'Layer-friendly neckline'
    ],
    bestFor: ['Yoga', 'Pilates', 'Everyday layering'],
    care: 'Gentle machine wash cold, dry flat',
    stock: 17,
    story: 'Built as the clean base layer in the assortment, with less visual noise and a more elevated neckline.'
  }),
  createProduct({
    id: 7,
    slug: 'relay-court-skort',
    name: 'Relay Court Skort',
    subcategory: 'skort',
    line: 'Relay',
    badge: 'Court Ready',
    price: 92,
    originalPrice: 108,
    image: 'https://images.pexels.com/photos/8223265/pexels-photo-8223265.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.6,
    reviews: 141,
    color: 'Soft Stone',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'SwiftWeave stretch woven',
    composition: '79% polyester, 21% elastane',
    activity: 'Court / Daily',
    silhouette: 'A-line performance skort',
    fitProfile: 'Structured skim fit',
    supportLevel: 'Medium hold shortie',
    description: 'A polished court skort with a smooth outer layer, hidden shortie liner, and enough structure to feel finished all day.',
    features: [
      'Built-in shortie',
      'Flat waistband',
      'Side ball pocket',
      'Low-sheen woven face',
      'Easy swing shape'
    ],
    bestFor: ['Tennis', 'Padel', 'Off-court styling'],
    care: 'Machine wash cold, hang dry',
    stock: 14,
    story: 'The line was designed to bridge sport and styling, so it feels as intentional with sneakers as it does on court.'
  }),
  createProduct({
    id: 8,
    slug: 'horizon-recovery-hoodie',
    name: 'Horizon Recovery Hoodie',
    subcategory: 'jackets',
    line: 'Horizon',
    badge: 'Recovery Layer',
    price: 138,
    originalPrice: 158,
    image: 'https://images.pexels.com/photos/2395842/pexels-photo-2395842.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.8,
    reviews: 196,
    color: 'Heather Ash',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'Recovery fleece',
    composition: '54% cotton, 40% recycled polyester, 6% elastane',
    activity: 'Recovery / Travel',
    silhouette: 'Relaxed zip hoodie',
    fitProfile: 'Relaxed layer fit',
    supportLevel: 'Soft recovery warmth',
    description: 'A premium recovery hoodie with a compact face, brushed interior, and a relaxed shoulder that still feels clean when zipped.',
    features: [
      'Brushed interior',
      'Two-way zipper',
      'Dropped shoulder',
      'Secure zip pockets',
      'Travel-friendly warmth'
    ],
    bestFor: ['Recovery days', 'Travel', 'Warm-up layers'],
    care: 'Machine wash cold, tumble dry low',
    stock: 21,
    story: 'This hoodie is cut with slightly more room through the shoulder so it layers over tanks and bras without losing shape.'
  }),
  createProduct({
    id: 10,
    slug: 'interval-track-pant',
    name: 'Interval Track Pant',
    subcategory: 'pants',
    line: 'Interval',
    badge: 'Travel Ready',
    price: 118,
    originalPrice: 138,
    image: 'https://images.pexels.com/photos/27918260/pexels-photo-27918260.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.6,
    reviews: 133,
    color: 'Carbon Grey',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'MoveLite woven',
    composition: '86% recycled polyester, 14% elastane',
    activity: 'Travel / Warm-up',
    silhouette: 'Tapered track pant',
    fitProfile: 'Relaxed through thigh, tapered at ankle',
    supportLevel: 'Lightweight coverage',
    description: 'A tapered performance pant with a soft woven face, easy waistband, and travel-friendly polish for warm-ups and all-day wear.',
    features: [
      'Tapered ankle',
      'Elastic waistband',
      'Zip hand pockets',
      'Low-bulk woven stretch',
      'Clean front finish'
    ],
    bestFor: ['Warm-ups', 'Travel', 'Daily wear'],
    care: 'Machine wash cold, hang dry',
    stock: 19,
    story: 'The leg narrows toward the ankle to keep the silhouette cleaner than a standard jogger.'
  }),
  createProduct({
    id: 11,
    slug: 'mono-air-boxy-tee',
    name: 'Mono Air Boxy Tee',
    subcategory: 't-shirts',
    line: 'Mono Air',
    badge: 'New Tee',
    price: 58,
    originalPrice: 68,
    image: 'https://images.pexels.com/photos/18139574/pexels-photo-18139574.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.8,
    reviews: 94,
    color: 'Optic White',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'AirCotton modal jersey',
    composition: '52% cotton, 41% modal, 7% elastane',
    activity: 'Street / Recovery',
    silhouette: 'Boxy short-sleeve T-shirt',
    fitProfile: 'Relaxed cropped box fit',
    supportLevel: 'Featherweight drape',
    description: 'A clean boxy T-shirt with a dense collar, soft modal hand feel, and a cropped length that sits neatly over high-rise trousers.',
    features: [
      'Boxy shoulder',
      'Dense rib collar',
      'Soft modal blend',
      'Shape-retention finish',
      'Easy cropped length'
    ],
    bestFor: ['Street styling', 'Recovery days', 'Layering'],
    care: 'Machine wash cold, reshape while damp, dry flat',
    stock: 32,
    story: 'The tee is intentionally minimal: a stronger neckline, cleaner shoulder, and enough weight to look styled instead of basic.'
  }),
  createProduct({
    id: 12,
    slug: 'graphite-relay-oversized-tee',
    name: 'Graphite Relay Oversized Tee',
    subcategory: 't-shirts',
    line: 'Relay Cotton',
    badge: 'Modern Fit',
    price: 64,
    originalPrice: 78,
    image: 'https://images.pexels.com/photos/16929212/pexels-photo-16929212.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.7,
    reviews: 118,
    color: 'Graphite Black',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Compact cotton jersey',
    composition: '92% organic cotton, 8% elastane',
    activity: 'Training / Daily',
    silhouette: 'Oversized drop-shoulder T-shirt',
    fitProfile: 'Relaxed oversized fit',
    supportLevel: 'Soft everyday coverage',
    description: 'A modern oversized tee with a drop shoulder, clean sleeve shape, and a smooth compact knit made for training days and off-duty looks.',
    features: [
      'Drop shoulder',
      'Oversized sleeve',
      'Compact jersey face',
      'Side vent hem',
      'Pre-shrunk finish'
    ],
    bestFor: ['Light training', 'Streetwear looks', 'Travel'],
    care: 'Machine wash cold with similar colors, tumble dry low',
    stock: 27,
    story: 'Cut with extra room through the chest while keeping the hem controlled, so it layers over leggings or tailored pants without feeling sloppy.'
  }),
  createProduct({
    id: 13,
    slug: 'metro-pleat-wide-trouser',
    name: 'Metro Pleat Wide Trouser',
    subcategory: 'trousers',
    line: 'Metro Form',
    badge: 'Tailored',
    price: 128,
    originalPrice: 148,
    image: 'https://images.pexels.com/photos/20709539/pexels-photo-20709539.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.9,
    reviews: 86,
    color: 'Moss Green',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'FluidForm stretch twill',
    composition: '63% recycled polyester, 31% viscose, 6% elastane',
    activity: 'Commute / Studio',
    silhouette: 'Wide-leg pleated trouser',
    fitProfile: 'Relaxed waist-to-hem drape',
    supportLevel: 'Tailored easy movement',
    description: 'A wide-leg trouser with soft front pleats, a clean waistband, and fluid stretch that moves easily from studio layers to city styling.',
    features: [
      'Front pleats',
      'Wide-leg drape',
      'Clean hook closure',
      'Deep side pockets',
      'Soft stretch twill'
    ],
    bestFor: ['Commute looks', 'Smart casual styling', 'Travel days'],
    care: 'Machine wash cold, hang dry, warm iron if needed',
    stock: 18,
    story: 'This trouser brings a sharper fashion silhouette into the collection while keeping enough stretch for real movement.'
  }),
  createProduct({
    id: 14,
    slug: 'aero-cargo-tapered-trouser',
    name: 'Aero Cargo Tapered Trouser',
    subcategory: 'trousers',
    line: 'Aero Cargo',
    badge: 'Utility',
    price: 116,
    originalPrice: 136,
    image: 'https://images.pexels.com/photos/27312463/pexels-photo-27312463.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.7,
    reviews: 102,
    color: 'Burnt Red',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'LiteTech stretch ripstop',
    composition: '88% recycled nylon, 12% elastane',
    activity: 'Travel / Street',
    silhouette: 'Tapered utility trouser',
    fitProfile: 'Relaxed thigh with tapered leg',
    supportLevel: 'Lightweight utility coverage',
    description: 'A tapered modern trouser with low-profile cargo pockets, crisp panel lines, and a lightweight stretch shell for elevated streetwear styling.',
    features: [
      'Low-profile cargo pockets',
      'Tapered leg',
      'Adjustable hem tab',
      'Secure zip pocket',
      'Water-repellent finish'
    ],
    bestFor: ['Travel', 'Urban styling', 'Warm-up layers'],
    care: 'Machine wash cold, hang dry',
    stock: 22,
    story: 'The cargo details are flattened and tonal, giving the trouser function without the bulky outdoor look.'
  }),
  createProduct({
    id: 15,
    slug: 'tempo-thermal-relaxed-tee',
    name: 'Tempo Thermal Relaxed Tee',
    subcategory: 't-shirts',
    line: 'Tempo Knit',
    badge: 'Fresh Drop',
    price: 62,
    originalPrice: 74,
    image: 'https://images.pexels.com/photos/24235259/pexels-photo-24235259.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.8,
    reviews: 76,
    color: 'Mineral Clay',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Breathable thermal jersey',
    composition: '58% organic cotton, 36% recycled polyester, 6% elastane',
    activity: 'Warm-up / Daily',
    silhouette: 'Relaxed crewneck T-shirt',
    fitProfile: 'Easy straight fit',
    supportLevel: 'Textured everyday coverage',
    description: 'A relaxed thermal T-shirt with a subtle waffle texture, clean crew neckline, and enough stretch to move comfortably through warm-ups or long travel days.',
    features: [
      'Waffle-knit texture',
      'Soft rib crewneck',
      'Straight hem',
      'Shape-holding stretch',
      'Breathable midweight feel'
    ],
    bestFor: ['Warm-ups', 'Travel days', 'Layered street looks'],
    care: 'Machine wash cold, tumble dry low',
    stock: 29,
    story: 'The thermal surface gives the tee more dimension while keeping the shape simple enough to pair with sharper trousers.'
  }),
  createProduct({
    id: 16,
    slug: 'aura-cropped-muscle-tee',
    name: 'Aura Cropped Muscle Tee',
    subcategory: 't-shirts',
    line: 'Aura Cotton',
    badge: 'Cropped Fit',
    price: 54,
    originalPrice: 64,
    image: 'https://images.pexels.com/photos/3024258/pexels-photo-3024258.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.7,
    reviews: 91,
    color: 'Washed Lilac',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'Compact slub cotton',
    composition: '96% organic cotton, 4% elastane',
    activity: 'Studio / Street',
    silhouette: 'Cropped muscle T-shirt',
    fitProfile: 'Boxy shoulder with cropped hem',
    supportLevel: 'Soft light coverage',
    description: 'A cropped muscle tee with a structured shoulder, smooth arm opening, and compact cotton feel made to sit cleanly above high-rise bottoms.',
    features: [
      'Cropped length',
      'Structured shoulder',
      'Smooth arm opening',
      'Compact cotton face',
      'Pre-washed softness'
    ],
    bestFor: ['Studio layers', 'High-rise styling', 'Recovery days'],
    care: 'Machine wash cold, reshape while damp',
    stock: 24,
    story: 'This tee adds a sharper sleeveless option to the T-shirt group without feeling like a gym-only tank.'
  }),
  createProduct({
    id: 17,
    slug: 'axis-straight-leg-trouser',
    name: 'Axis Straight-Leg Trouser',
    subcategory: 'trousers',
    line: 'Axis Tailored',
    badge: 'New Trouser',
    price: 124,
    originalPrice: 144,
    image: 'https://images.pexels.com/photos/19995460/pexels-photo-19995460.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.8,
    reviews: 68,
    color: 'Deep Taupe',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'Flex suiting twill',
    composition: '66% recycled polyester, 28% rayon, 6% elastane',
    activity: 'Office / Commute',
    silhouette: 'Straight-leg tailored trouser',
    fitProfile: 'Mid-rise clean straight fit',
    supportLevel: 'Polished stretch structure',
    description: 'A straight-leg trouser with a smooth front, flexible waistband, and suiting-inspired drape for days that move from desk to dinner.',
    features: [
      'Straight-leg line',
      'Clean front waistband',
      'Back welt pockets',
      'Soft suiting drape',
      'Hidden stretch panel'
    ],
    bestFor: ['Commute dressing', 'Office styling', 'Travel looks'],
    care: 'Machine wash cold, hang dry, warm iron if needed',
    stock: 17,
    story: 'The straight leg gives the collection a more classic trouser option while preserving the stretch users expect from the performance line.'
  }),
  createProduct({
    id: 18,
    slug: 'orbit-barrel-leg-trouser',
    name: 'Orbit Barrel-Leg Trouser',
    subcategory: 'trousers',
    line: 'Orbit Form',
    badge: 'Statement Fit',
    price: 132,
    originalPrice: 156,
    image: 'https://images.pexels.com/photos/15262908/pexels-photo-15262908.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.6,
    reviews: 54,
    color: 'Ink Olive',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'Structured stretch canvas',
    composition: '74% cotton, 22% recycled nylon, 4% elastane',
    activity: 'Street / Travel',
    silhouette: 'Barrel-leg utility trouser',
    fitProfile: 'Relaxed hip with curved leg',
    supportLevel: 'Structured movement coverage',
    description: 'A barrel-leg trouser with sculpted paneling, a curved outseam, and a soft structured canvas that brings a fashion shape into everyday movement.',
    features: [
      'Curved barrel leg',
      'Paneled outseam',
      'Adjustable waist tabs',
      'Deep utility pockets',
      'Structured canvas hand'
    ],
    bestFor: ['Street styling', 'Gallery days', 'Travel layers'],
    care: 'Machine wash cold inside out, hang dry',
    stock: 15,
    story: 'The curved leg creates a stronger silhouette for customers who want trousers that feel styled before adding anything else.'
  }),
  createProduct({
    id: 19,
    slug: 'surge-bike-short-7',
    name: 'Surge Bike Short 7"',
    subcategory: 'shorts',
    line: 'Surge Sculpt',
    badge: 'Core Short',
    price: 72,
    originalPrice: 86,
    image: 'https://images.pexels.com/photos/16848896/pexels-photo-16848896.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.8,
    reviews: 146,
    color: 'Black Cherry',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'MuseCompress interlock',
    composition: '70% recycled nylon, 30% elastane',
    activity: 'Training / Studio',
    silhouette: 'High-rise 7-inch bike short',
    fitProfile: 'Compressive stay-put fit',
    supportLevel: 'High hold',
    description: 'A high-rise bike short with smooth compression, a no-roll waistband, and a seven-inch inseam that stays put through studio sets and summer runs.',
    features: [
      'High-rise waistband',
      '7-inch inseam',
      'No-roll top edge',
      'Side phone pocket',
      'Sweat-wicking compression'
    ],
    bestFor: ['Strength training', 'Spin class', 'Hot weather layers'],
    care: 'Machine wash cold, line dry',
    stock: 31,
    story: 'This short rounds out the bottoms range with a tighter training option for customers who want support without full-length coverage.'
  }),
  createProduct({
    id: 20,
    slug: 'coast-woven-pull-on-short',
    name: 'Coast Woven Pull-On Short',
    subcategory: 'shorts',
    line: 'Coast Woven',
    badge: 'Easy Short',
    price: 76,
    originalPrice: 92,
    image: 'https://images.pexels.com/photos/12658948/pexels-photo-12658948.jpeg?auto=compress&cs=tinysrgb&w=900',
    rating: 4.7,
    reviews: 83,
    color: 'Parchment Beige',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'SwiftWeave stretch woven',
    composition: '82% recycled polyester, 18% elastane',
    activity: 'Walk / Travel',
    silhouette: 'Pull-on woven short',
    fitProfile: 'Relaxed mid-rise fit',
    supportLevel: 'Lightweight easy coverage',
    description: 'A pull-on woven short with a polished waistband, soft pleat detail, and breezy stretch for walks, travel days, and relaxed warm-weather styling.',
    features: [
      'Pull-on waistband',
      'Soft front pleats',
      'Angled hand pockets',
      'Breezy stretch woven',
      'Polished curved hem'
    ],
    bestFor: ['Warm weather walks', 'Travel days', 'Weekend styling'],
    care: 'Machine wash cold, hang dry',
    stock: 26,
    story: 'The woven shape gives shorts a more styled place in the collection, sitting closer to tailoring than running gear.'
  })
];

function productTypeLabel(product) {
  const labels = {
    leggings: 'Legging',
    'sports-bra': 'Sports Bra',
    jackets: 'Layer',
    tops: 'Top',
    shorts: 'Short',
    skort: 'Skort',
    pants: 'Pant',
    't-shirts': 'T-Shirt',
    trousers: 'Trouser'
  };

  return labels[product.subcategory] || product.subcategory.replace(/-/g, ' ');
}

function productStructureLabel(product) {
  const type = productTypeLabel(product);
  return product.silhouette ? `${type} / ${product.silhouette}` : type;
}

const getAllProducts = () => PRODUCT_CATALOG;

function searchableText(product) {
  return [
    product.name,
    product.description,
    product.color,
    product.line,
    product.activity,
    product.silhouette,
    product.fitProfile,
    product.supportLevel,
    product.fabric,
    ...(product.bestFor || []),
    ...(product.features || [])
  ].join(' ').toLowerCase();
}

/**
 * Get products by category
 */
const getProductsByCategory = category => {
  return getAllProducts().filter(product => product.category === category);
};

/**
 * Get product by ID
 */
const getProductById = id => {
  return getAllProducts().find(product => product.id === id);
};

/**
 * Filter products by multiple criteria
 */
const filterProducts = filters => {
  let products = getAllProducts();

  if (filters.category) {
    products = products.filter(product => product.category === filters.category);
  }

  if (filters.minPrice) {
    products = products.filter(product => product.price >= filters.minPrice);
  }

  if (filters.maxPrice) {
    products = products.filter(product => product.price <= filters.maxPrice);
  }

  if (filters.sizes && filters.sizes.length > 0) {
    products = products.filter(product => product.sizes.some(size => filters.sizes.includes(size)));
  }

  if (filters.rating) {
    products = products.filter(product => product.rating >= filters.rating);
  }

  if (filters.search) {
    const term = filters.search.toLowerCase();
    products = products.filter(product => searchableText(product).includes(term));
  }

  return products;
};

/**
 * Sort products
 */
const sortProducts = (products, sortBy) => {
  const sorted = [...products];

  switch (sortBy) {
    case 'price-low':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-high':
      return sorted.sort((a, b) => b.price - a.price);
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'reviews':
      return sorted.sort((a, b) => b.reviews - a.reviews);
    case 'newest':
      return sorted.sort((a, b) => b.id - a.id);
    default:
      return sorted;
  }
};
