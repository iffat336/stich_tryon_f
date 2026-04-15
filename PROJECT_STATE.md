# KINETIC MUSE Project State

## Local App

- Main app: `http://127.0.0.1:8000`
- Collections: `http://127.0.0.1:8000/collections.html`
- Try-On: `http://127.0.0.1:8000/try-on.html`
- Product example: `http://127.0.0.1:8000/product.html?productId=1`
- Bag: `http://127.0.0.1:8000/cart.html`
- Checkout: `http://127.0.0.1:8000/flow.html`

## Current Catalog

Active catalog is athletic-only with 18 products:

1. Apex Sculpt 7/8 Legging
2. Atmos Run Shell
3. StudioForm Longline Layer
4. Drift Split Short
5. Pulse Seamless Tank
6. Relay Court Skort
7. Horizon Recovery Hoodie
8. Interval Track Pant
9. Mono Air Boxy Tee
10. Graphite Relay Oversized Tee
11. Metro Pleat Wide Trouser
12. Aero Cargo Tapered Trouser
13. Tempo Thermal Relaxed Tee
14. Aura Cropped Muscle Tee
15. Axis Straight-Leg Trouser
16. Orbit Barrel-Leg Trouser
17. Surge Bike Short 7"
18. Coast Woven Pull-On Short

## Product Data Structure

Each active product now uses a richer structure including:

- `id`
- `slug`
- `name`
- `category`
- `subcategory`
- `line`
- `badge`
- `price`
- `originalPrice`
- `image`
- `rating`
- `reviews`
- `color`
- `sizes`
- `fabric`
- `composition`
- `activity`
- `silhouette`
- `fitProfile`
- `supportLevel`
- `description`
- `features`
- `bestFor`
- `care`
- `stock`
- `story`

## Main Updated Files

- `products.js`
- `index.html`
- `collections.html`
- `product.html`
- `try-on.html`
- `try-on-simple.js`
- `cart.html`
- `flow.html`
- `wishlist.html`
- `cart-enhanced.js`

## Current Direction

- Heritage collection removed from active app flow
- Athletic catalog expanded and normalized
- Try-on upgraded with live catalog sync, richer visual polish, auto-fit, split compare, garment focus, fit meter, styling notes, and product-aware category filters
- Collections and product pages aligned to richer product metadata
