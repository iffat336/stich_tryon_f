Transparent garment PNGs for exact try-on go in this folder.

Name each file with the product slug from `products.js`.

Examples:
- `try-on-assets/atmos-run-shell.png`
- `try-on-assets/studioform-longline-layer.png`
- `try-on-assets/mono-air-boxy-tee.png`

Asset guidelines:
- Use a transparent PNG background.
- Keep the garment centered in the frame.
- Prefer front-view cutouts without a model.
- Use the full canvas height for long garments.
- Match the product color and silhouette as closely as possible.

How the app uses them:
- If the PNG exists, the try-on page places that exact product asset on the uploaded photo.
- If the PNG is missing, the app falls back to the smart generated preview and shows `PNG Needed` in the UI.
