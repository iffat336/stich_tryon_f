# Project Context

This folder contains the Stich AI virtual try-on demo.

## What This Project Does

The project is a pitch-ready AI virtual try-on web demo for fashion brands such as Sapphire and Nishat.

Users can:

- Upload their own/customer photo.
- Upload a dress or garment image.
- Generate an AI virtual try-on result.
- See a recommended size: Small, Medium, or Large.
- See fit confidence.
- Compare before and after images.
- Open an enhanced HD preview of the result.

## Live Links

Direct try-on page:

```text
https://stichtryonf-production.up.railway.app/simple-tryon.html
```

Main website:

```text
https://stichtryonf-production.up.railway.app
```

GitHub:

```text
https://github.com/iffat336/stich_tryon_f
```

## Open First

Read these files first:

```text
START_HERE.md
OPENCLAW_HANDOFF.md
```

## Main Files

```text
simple-tryon.html      Main working try-on pitch page
serve-local.cjs        Node server and /api/tryon API
package.json           Railway start script
try-on.html            Advanced studio page
try-on-simple.js       Advanced studio JavaScript
products.js            Product catalog
```

## Railway Deployment

Railway service:

```text
stich_tryon_f
```

Railway domain:

```text
stichtryonf-production.up.railway.app
```

Start command:

```text
npm start
```

`package.json` runs:

```text
node serve-local.cjs
```

The server listens on:

```js
process.env.PORT || 8000
```

## Latest Work Completed

Recent commits:

```text
0eb93ce Add project handoff notes
8c6b992 Enhance try-on result preview quality
9c24d3b Improve try-on result image display quality
8df28bd Polish simple try-on pitch demo
cbe500e Show recommended size with try-on result
165664b Add simple try-on size recommendation
```

Features added:

- Pitch header for fashion brands.
- Four-step flow.
- Measurement fields.
- Recommended size card.
- Fit confidence percentage.
- Before/after comparison.
- Business value section.
- Enhanced HD result preview.
- Client-side image upscaling and light sharpening.

## Known Limitation

If the AI model itself returns a blurry image, frontend enhancement helps but cannot fully restore lost detail. A production version should add a dedicated image upscaler/restoration model.

## Pitch Email

Subject:

```text
AI Virtual Try-On Demo for [Sapphire/Nishat]
```

Body:

```text
Hi [Name],

I am Iffat Nazir, an AI/Web Developer. I have built a working AI virtual try-on demo for fashion e-commerce, designed for brands like [Sapphire/Nishat].

The demo allows a customer to:

- Upload their own photo
- Upload or select a dress image
- Generate an AI try-on result
- Get a recommended size: Small, Medium, or Large
- View before/after comparison and fit confidence

Live demo:
https://stichtryonf-production.up.railway.app/simple-tryon.html

This kind of feature can help fashion brands improve online shopping confidence, reduce return rates, and make product pages more interactive for customers.

I would love to show you a short demo and discuss how this could be customized for your product catalog.

Best regards,
Iffat Nazir
AI/Web Developer
GitHub: https://github.com/iffat336
```

## Next Best Steps

1. Test the live demo after every Railway deploy.
2. Take screenshots of the upload screen, result screen, and size recommendation.
3. Send the pitch email to brand contacts.
4. If a brand responds, prepare a short 5-minute demo.
5. For production, move the HuggingFace token to a secure server-side environment variable.
