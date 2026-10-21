# KH Luxury Frontend Build Plan

## Goal
Build a complete, responsive, frontend-only luxury fashion commerce experience for KH LUXURY, covering the storefront, checkout, customer account, and admin operations. Use realistic mock data and local interface state only. Keep all data shapes and components ready for a later Lovable Cloud integration without implementing authentication, persistence, APIs, or payments now.

## Visual Direction
- Preserve the uploaded KH LUXURY logo exactly and use it throughout the storefront, checkout, account, mobile navigation, footer, and admin area.
- Use the supplied palette: Obsidian Black, Warm Ivory, Champagne Gold, Espresso, Sand, Charcoal, and White.
- Build an editorial luxury system with strong serif display typography, restrained sans-serif utility text, generous whitespace, sharp imagery, fine borders, minimal radii, and sparse gold accents.
- Use cohesive, high-quality African luxury fashion imagery generated specifically for this application rather than generic stock placeholders.
- Keep motion subtle: image scale on product hover, gentle drawer/dialog transitions, and restrained page feedback.

## Build Phases

### 1. Foundation and Shared System
- Define semantic color, typography, spacing, border, and motion tokens.
- Store the official uploaded logo through the project asset flow.
- Create typed mock models and catalog/order/customer/payment/settings datasets.
- Build shared components: branded buttons, fields, selectors, breadcrumbs, badges, quantity controls, upload areas, status indicators, empty/loading/error states, dialogs, toasts, and responsive tables.
- Build reusable storefront shell: announcement bar, sticky navigation, mobile menu, search overlay, cart drawer, footer, and floating WhatsApp action.
- Build reusable admin shell with collapsible desktop sidebar and mobile navigation.

### 2. Storefront Discovery
- Home (`/`): immersive fashion-led hero, new arrivals, featured collection, best sellers, category editorial, customization feature, brand story and vision, reviews, social content, WhatsApp, and newsletter.
- Shop (`/shop`): search, category/price/size/color/availability filters, sorting, filter drawer on mobile, no-results state, and responsive product grid.
- Collections and category browsing (`/collections`, `/category/$category`): editorial collection index and filtered category views.
- Product details (`/product/$productId`): image gallery, thumbnails, variant selectors, quantity, inventory, cart/wishlist actions, accordions, related products, and reviews.
- Reusable product cards with wishlist, quick view, color swatches, and add-to-cart interactions.

### 3. Cart, Customization, and Checkout
- Wishlist (`/wishlist`) and Cart (`/cart`) with editable mock state and polished empty states.
- Tee customizer (`/customize`) with tee, size, color, quantity, drag-and-drop file preview/removal, instructions, price summary, and add-to-cart confirmation.
- Multi-step Checkout (`/checkout`) with customer details, delivery, order review, manual transfer details, receipt upload, validation, and progress navigation.
- Dedicated payment instructions (`/payment-instructions`) and receipt upload (`/payment-receipt`) screens.
- Order confirmation (`/order-confirmation`) with pending-verification status, delivery details, summary, and expected date.

### 4. Customer Account and Brand Pages
- Account overview (`/account`) with summary metrics, recent orders, and activity.
- Orders (`/account/orders`) and order details (`/account/orders/$orderId`) with responsive line items and visual progress tracker.
- Customer wishlist, profile, reviews, and settings screens under the account area.
- Review submission (`/reviews`) with rating, text, optional image preview, mock submission, and existing review examples.
- Editorial About (`/about`), Contact (`/contact`), Terms (`/terms`), and Privacy (`/privacy`) pages.
- Frontend-only authentication screens (`/login`, `/register`, `/forgot-password`) clearly presented as preview interactions without real sign-in.

### 5. Admin Frontend
- Admin dashboard (`/admin`) with KPI cards, sales chart, order status overview, payment activity, recent orders, and recent customers.
- Products (`/admin/products`), add/edit forms, product detail preview, categories, and confirmation-based mock deletion.
- Orders and order details with status controls and the same underlying mock order model used by customer screens.
- Customers, payments, and receipt review with view/confirm/reject/request-new-receipt mock actions.
- Delivery locations with add/edit/delete and enabled-state controls.
- Reviews moderation.
- Brand, payment, WhatsApp, profile, and security settings forms.
- Every admin table adapts into scannable mobile records rather than horizontal overflow where practical.

### 6. Routing, Metadata, and Quality Pass
- Give every content route unique KH Luxury title, description, Open Graph title/description, `og:type`, and Twitter card metadata.
- Ensure all navigation links resolve and all primary actions provide visible mock feedback.
- Verify central flows end-to-end: browse → product → cart → checkout → receipt → confirmation; customize → cart; account → order details; admin → payment review.
- Check desktop and mobile layouts for clipping, overlap, readability, and touch accessibility.
- Confirm clean diagnostics with no runtime or build errors.

## Technical Notes
- React 19, TypeScript, TanStack Start file routes, Tailwind CSS v4, existing shadcn primitives, Lucide icons, Sonner notifications, and Recharts.
- Shared mock state will use React context/reducers so cart, wishlist, uploads, checkout, and admin actions behave consistently across pages while remaining easy to replace later.
- Product and order IDs will use typed dynamic route parameters.
- Generated imagery and the uploaded logo remain project-managed assets; no hotlinked images.
- No database, authentication provider, backend API, file storage service, or payment processor will be added in this phase.

## Completion Criteria
- Every requested customer and admin destination is reachable through the interface.
- Shopping, customization, checkout, account, and admin review flows work as realistic frontend demonstrations.
- The experience remains visually coherent and polished across mobile, tablet, and desktop.
- The frontend is organized so future data integration can replace mock repositories without rebuilding the visual layer.
