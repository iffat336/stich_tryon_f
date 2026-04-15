# KINETIC MUSE - Premium Women's Athletics E-Commerce Website

A modern, fully-functional e-commerce website built with **Tailwind CSS**, **Material Symbols**, and **Vanilla JavaScript**. Featuring a luxury athletic apparel brand with a complete shopping experience.

## Features

### 🎨 Modern Design
- **Material Design 3 Color System** with premium color palette
- **Responsive Layout** using Tailwind CSS grid and flexbox
- **Smooth Animations** and transitions throughout
- **Professional Typography** using Noto Serif and Manrope fonts
- **Glass-morphism Effects** for modern UI elements

### 🛒 Complete E-Commerce Functionality
- **Product Browsing**: Collections page with filtering options
- **Product Details**: Individual product pages with images and descriptions
- **Shopping Cart**:  Add/remove items, quantity management, persistent storage using localStorage
- **Order Summary**: Real-time cart totals with tax and shipping calculations
- **Checkout Flow**: Multi-step checkout with shipping and payment information
- **Quick Add**: Add products to cart directly from collections

### 💾 Data Persistence
- **Local Storage**: All cart data persists across browser sessions
- **Cart Badge**: Dynamic cart counter on navigation

### 🧭 Navigation
- **Seamless Navigation**: Smooth page transitions between collections, products, cart, and checkout
- **Responsive Mobile Menu**: Hamburger menu for mobile devices
- **Sticky Navigation**: Fixed header for easy access

## File Structure

```
shopping-bag-app/
├── index.html              # Homepage with hero section and featured products
├── collections.html        # Product collections with filtering
├── product.html            # Individual product page
├── cart.html              # Shopping cart with order summary
├── flow.html              # Checkout page with shipping & payment
├── cartLogic.js           # Cart management and calculations
├── renderCart.js          # Dynamic cart rendering
└── package.json           # Project dependencies
```

## Key JavaScript Functions

### Cart Operations (`cartLogic.js`)
- `getCart()` - Retrieve cart from localStorage
- `saveCart(cart)` - Save cart to localStorage  
- `addToCart(product)` - Add product to cart
- `updateQuantity(id, step)` - Increase/decrease quantity
- `removeFromCart(id)` - Remove item from cart
- `updateCartBadges()` - Update cart count badge
- `getCartTotals()` - Calculate subtotal, tax, shipping, total
- `handleQuickAdd()` - Quick add from collections
- `handleSizeSelect()` - Size selection on product page
- `handleDynamicAddToBag()` - Add to bag from product page

### Cart Rendering (`renderCart.js`)
- `renderCartPage()` - Dynamically render cart items with quantities

## Styling

- **Tailwind CSS**: Utility-first CSS framework with custom color palette
- **Material Symbols**: Google Material Icons for UI elements
- **Custom Styles**:
  - Glass-panel effects with backdrop blur
  - Hero gradients
  - Responsive spacing and sizing

## Color Palette

The custom Material Design 3 color scheme includes:
- **Primary**: #000000 (Black)
- **Secondary**: #5f5e5e (Gray)
- **Tertiary**: #000000 (Black)
- **Surface**: #fcf9f8 (Off-white)
- **Backgrounds**: Carefully selected tones for contrast and readability

## Product Data

Products include:
- **Aero-Kinetic Leggings** - $145.00
- **Gravity Sports Bra** - $85.00  
- **Crest Runner Sneakers** - $220.00
- **Sculpt Hoodie** - $240.00
- And many more...

## Pricing & Shipping

- **Subtotal Calculation**: Sum of (price × quantity) for all items
- **Tax**: 8% of subtotal
- **Shipping**:
  - Free on orders over $200
  - $15 for orders under $200
  - Free express option available at checkout
- **Total**: Subtotal + Tax + Shipping

## Browser Compatibility

- Modern browsers supporting ES6 JavaScript
- CSS Grid and Flexbox support
- localStorage API support
- Tested on Chrome, Firefox, Safari, Edge

## Getting Started

1. **Open in Browser**: Simply open `index.html` in a modern web browser
2. **Browse Products**: Click "Collections" to view all products
3. **Select a Product**: Click any product card to view details
4. **Add to Cart**: Choose size and click "Add to Bag"
5. **View Cart**: Click shopping bag icon to review your items
6. **Checkout**: Click "Proceed to Checkout" to complete your order

## Notes

- Cart data persists using browser's localStorage
- No backend required - fully client-side functionality
- Images are hosted externally (Google Images)
- All styling is inline with Tailwind utility classes

## Future Enhancements

- Backend integration with payment processing
- User accounts and order history
- Advanced product filtering
- Product reviews and ratings
- Wishlist functionality
- Multiple currency support
- Admin dashboard

---

**KINETIC MUSE** - Elevating human performance through the lens of high-fashion and technical innovation.
