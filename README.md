# Veenu Mehandi: Online Store

A fast, mobile-friendly mehndi supplies store. Plain HTML, CSS and JavaScript, so there is **nothing to install or build**. It runs on any hosting.

**Order flow:** customer adds to cart, checks out with delivery details, sees UPI payment details, sends the payment screenshot and order on WhatsApp. The order also arrives by email.

## 1. Things to fill in before going live

| What | Where | Status |
|---|---|---|
| Veenu's **UPI ID** | `assets/js/config.js` -> `upiId` | **Missing.** Until set, checkout asks the customer to message on WhatsApp for payment details |
| **Logo** | save as `assets/img/logo.png` (height about 120 px, transparent PNG) | Text logo is used until then |
| **Product photos** | `assets/img/products/` | See section 2 |
| **Instagram link** | `assets/js/config.js` -> `instagram` | Hidden until set |
| **Weights** for items marked `est: true` | `assets/js/products.js` | Estimates only. Shipping is calculated from these |
| **A4 Mehndi Book price** | `assets/js/products.js` (price is `null`) | Client wrote "19p". Disabled until confirmed |
| **Mix Oil 1 L price** | `assets/js/products.js` | Client sent 1640, the same as Bride Oil 1 L. Please confirm |
| Return window (hours) | `assets/js/config.js` -> `returnWindowHours` | Set to 48 as a draft |

## Payment: how UPI works

1. Open `assets/js/config.js` and put Veenu's UPI ID in one line, for example `upiId: "9812856568@ybl",`.
2. That is all. After a customer places an order, the payment screen shows:
   - the exact amount and the UPI ID with a **Copy** button,
   - a **QR code** made for that order (amount filled in), which customers on a computer scan with their phone,
   - an **Open UPI app** button on phones (one tap opens GPay, PhonePe, Paytm etc. with the amount filled in),
   - a **Send order on WhatsApp** button, so the customer sends the payment screenshot.
3. Veenu checks her UPI app, then confirms the order and ships within 48 hours.

Payments go straight to Veenu's UPI account, with no gateway fees. The site cannot see whether a payment arrived, so she confirms it herself in her UPI app. Automatic confirmation needs a gateway such as Razorpay, which has fees and is a later upgrade.

## 2. Adding product photos

Save photos in `assets/img/products/` named `<product-id>-1.jpg`, `<product-id>-2.jpg`, and so on (up to 5 per product). They appear on their own: no code change.

Product ids: `henna-powder`, `mix-oil`, `bride-oil`, `clove-essential-oil`, `cellophane-sheets`, `mehndi-pins`, `piping-bags`, `mehndi-book`, `acrylic-practice`, `spatula`, `stockings`, `henna-pillow`, `tape-dispenser`.

Tips: square photos, about 1000 x 1000 px, under 200 KB each (use squoosh.app to compress).

## 3. Changing prices or adding products

Everything is in `assets/js/products.js`. Copy an existing product block, change the `id`, name, description and variants. Price is in rupees; `weight` is the shipping weight in grams.

**Shipping** = Rs 70 per started kg of the total order weight (change in `config.js` -> `shippingPerKg`). Example: 2.1 kg is charged as 3 kg.

## 4. New-order email (one-time setup)

Orders are emailed to `veenumehandiproducts@gmail.com` through the free FormSubmit service. After the site is live, place one test order. FormSubmit sends a confirmation email to that address, and Veenu must click **Activate** once. Until then, orders still go through on WhatsApp.

To turn email off, set `orderEmailEndpoint` to `""` in `config.js`.

## 5. Publishing

Upload the whole folder to any static host. Easiest options:
- **Netlify**: drag and drop the folder at app.netlify.com/drop, then connect the domain.
- **Vercel / Cloudflare Pages / GitHub Pages**: also work with no settings.
- **Normal cPanel hosting**: upload the contents to `public_html`.

Then connect Veenu's domain at the host. The site must be served over HTTPS (all of the above do this automatically).

## 6. Pages

`index.html` home · `shop.html` · `product.html?id=...` · `cart.html` · `checkout.html` · `about.html` (About & Contact) · `shipping-returns.html` · `privacy-terms.html`

Policy pages and product descriptions are drafts written from the details the client sent. Have Veenu read and approve them.

## Not included (future / admin phase)

Customer login, order history, wishlist, discounts, automatic payment confirmation (needs a payment gateway such as Razorpay, which has fees), and the admin panel for managing products and orders without editing files.
