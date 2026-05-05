# Stich — AI Virtual Try-On for Fashion E-Commerce

A complete fashion e-commerce website with a **real AI virtual try-on feature** powered by HuggingFace Kolors. Customers upload their photo, select a garment, and see themselves wearing it in 30–60 seconds.

---

## Features

- **AI Virtual Try-On** — Real AI places selected garments on customer photos
- **Product Catalog** — 18+ fashion products with full detail pages
- **Shopping Cart** — Add to bag, wishlist, and checkout flow
- **Simple Try-On** — Clean single-page interface (`simple-tryon.html`)
- **Studio Try-On** — Advanced studio with overlay controls (`try-on.html`)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, Tailwind CSS, Vanilla JS |
| Try-On AI | HuggingFace — Kwai-Kolors/Kolors-Virtual-Try-On |
| Backend | Node.js (serve-local.cjs) |
| Deployment | Render.com (Node.js web service) |

---

## Getting Started

### Requirements
- Node.js 18+
- Free HuggingFace token from huggingface.co/settings/tokens

### Run Locally

```bash
git clone https://github.com/iffat336/stich_tryon_f.git
cd stich_tryon_f
node serve-local.cjs
```

Open: `http://127.0.0.1:8000/simple-tryon.html`

---

## How the Try-On Works

```
User uploads photo + selects garment
        ↓
POST /api/tryon (Node.js server)
        ↓
Images sent to HuggingFace Kolors AI space
        ↓
AI generates try-on result (30-60 seconds)
        ↓
Result image shown to user
```

---

## Deploy to Render.com (Free)

1. Fork this repo
2. Go to render.com → New Web Service
3. Connect your GitHub repo
4. Start command: `node serve-local.cjs`
5. Click Deploy

---

## API Reference

### POST /api/tryon

```json
// Request
{
  "personImage": "data:image/jpeg;base64,...",
  "garmentImage": "data:image/jpeg;base64,...",
  "hfToken": "hf_your_token_here"
}

// Response
{
  "ok": true,
  "result": "data:image/webp;base64,..."
}
```

---

## Project Structure

```
stich_tryon_f/
├── index.html              # Homepage
├── collections.html        # Product catalog
├── product.html            # Product detail page
├── cart.html               # Shopping cart
├── simple-tryon.html       # Simple try-on ← Start here
├── try-on.html             # Advanced try-on studio
├── serve-local.cjs         # Node.js server + API
├── try-on-engine.js        # HuggingFace AI integration
├── try-on-simple.js        # Studio UI logic
└── products.js             # Product catalog data
```

---

## For Fashion Brands

Built as a pitch demo for Pakistani fashion brands (Nishat, Sapphire, Khaadi).

**What brands get:**
- AI try-on integrated into their existing website
- Works in any browser — no app needed
- Customer photos stay in browser only (privacy-safe)
- Reduces return rates — customers preview fit before buying

---

## Author

**Iffat Nazir** — Freelance AI/Web Developer, Faisalabad, Pakistan

- Portfolio: [iterativeaisolutions.com](https://iterativeaisolutions.com)
- GitHub: [github.com/iffat336](https://github.com/iffat336)
- LinkedIn: [linkedin.com/in/iffat-nazir-136a1b191](https://linkedin.com/in/iffat-nazir-136a1b191)
