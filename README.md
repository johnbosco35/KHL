# KH Luxury Studio

KH LUXURY — FRONTEND DEVELOPMENT PROMPT
Build the complete frontend of a premium luxury fashion e-commerce application for a brand called:
KH LUXURY

IMPORTANT:
This prompt is ONLY for the frontend/UI/UX.
Do NOT set up Supabase yet.
Do NOT create the database yet.
Do NOT implement backend APIs yet.
Do NOT implement real authentication yet.
Do NOT implement real payment processing yet.
For now, focus entirely on creating the complete frontend experience, navigation, pages, components, responsive design, interactions and visual system.
Use realistic mock data where necessary so the entire interface can be previewed and tested.
The frontend must be structured cleanly so that Supabase can be connected later without rebuilding the UI.

==================================================
BRAND LOGO
==================================================

I have uploaded the official KH Luxury logo.
Use the uploaded logo as the official brand logo throughout the application.
Do NOT redesign, recreate, distort or replace the logo.

Use the logo appropriately in:
- Navbar
- Footer
- Authentication screens
- Admin dashboard
- Mobile navigation
- Checkout
- Other appropriate brand locations

==================================================
BRAND IDENTITY
==================================================

Brand:
KH LUXURY

The website should communicate:
- Luxury
- Elegance
- Sophistication
- Confidence
- Modern fashion
- Premium quality
- African fashion identity
- Exclusivity

The website should NOT look like a generic clothing store.
It should feel like a mature luxury fashion brand.

==================================================
COLOR SYSTEM
==================================================

Use this color palette consistently:

Primary:
Obsidian Black — #111111

Secondary:
Warm Ivory — #F7F3EC

Luxury Accent:
Champagne Gold — #B89B5E

Deep Accent:
Espresso — #2A211B

Soft Background:
Sand — #E9E1D5

Text:
Charcoal — #242424

White:
#FFFFFF

Use Champagne Gold sparingly.

Gold should mainly be used for:
- Small accents
- Borders
- Icons
- Hover states
- Important highlights
- Premium CTA details

Do NOT make the entire website gold.

The main visual language should be black, ivory and subtle champagne gold.

==================================================
DESIGN STYLE
==================================================

Create a:
- Premium
- Minimal
- Editorial
- Fashion-forward
- Sophisticated
- Modern
- Clean
- High-end

visual experience.

Use:
- Large fashion imagery
- Strong typography
- Generous whitespace
- Elegant layouts
- Subtle borders
- Refined hover effects
- Smooth transitions
- Editorial-style product grids
- Premium card layouts

Avoid:
- Excessive rounded cards
- Cartoon-like UI
- Excessive shadows
- Bright colors
- Cheap gradients
- Overly colorful buttons
- Generic SaaS designs
- Excessive animations
- Clutter

==================================================
TECHNOLOGY
==================================================

Use:
- React
- TypeScript
- Tailwind CSS
- Modern component architecture

Keep the code modular and reusable.

Create reusable components for:
- Navbar
- Footer
- Buttons
- Product cards
- Product grids
- Product filters
- Product image gallery
- Cart drawer
- Wishlist button
- Modal
- Forms
- Inputs
- Toast notifications
- Loading states
- Empty states
- Confirmation dialogs
- Breadcrumbs
- Admin sidebar
- Admin tables
- Admin cards
- Admin forms

==================================================
CUSTOMER WEBSITE
==================================================

Create the following customer-facing pages:

1. Home
2. Shop
3. Category
4. Product Details
5. Wishlist
6. Cart
7. Blank Tee Customization
8. Checkout
9. Payment Instructions
10. Payment Receipt Upload
11. Order Confirmation
12. Customer Account
13. Orders
14. Order Details
15. Reviews
16. About KH Luxury
17. Contact
18. Terms & Conditions
19. Privacy Policy

==================================================
HOME PAGE
==================================================

Create a visually impressive luxury fashion homepage.

Hero section:
- KH Luxury logo
- Large premium fashion image
- Strong headline
- Short brand statement
- Shop Collection button
- Explore button

Create sections for:
- New Arrivals
- Featured Collection
- Best Sellers
- Product Categories
- Blank Tee Customization
- Brand Story
- Brand Vision
- Customer Reviews
- Social Media
- WhatsApp Contact
- Newsletter/Brand Updates

Use realistic fashion placeholder imagery where actual product images are unavailable.
Do not use random low-quality stock images.

The homepage should feel like a real luxury fashion brand website.

==================================================
NAVIGATION
==================================================

Create a premium responsive navigation bar.

Desktop navigation:
KH LUXURY logo

Links:
Home
Shop
Collections
Customize
About

Right side:
Search
Wishlist
Cart
Account

Add a WhatsApp contact button/icon.

Mobile navigation should have a clean hamburger menu.

The navigation should remain visually elegant when scrolling.

==================================================
SHOP PAGE
==================================================

Create a complete shopping interface.

Categories:
- Tees
- Polos
- Joggers
- Jackets
- Shorts
- Blank Tees
- New Arrivals
- Featured

Include:
- Search
- Category filter
- Price filter
- Size filter
- Color filter
- Availability filter
- Sorting

Sorting options:
- Newest
- Price Low to High
- Price High to Low
- Popular
- Featured

Create a premium responsive product grid.

==================================================
PRODUCT CARD
==================================================

Each product card should display:
- Product image
- Product name
- Price
- Category
- Available colors
- Wishlist button
- Quick view
- Add to cart

Add subtle hover interactions.
Do not over-animate.

==================================================
PRODUCT DETAILS
==================================================

Create a premium product detail page.

Include:
- Large image gallery
- Thumbnail gallery
- Product name
- Price
- Description
- Size selector
- Color selector
- Quantity selector
- Stock status
- Add to Cart
- Add to Wishlist
- Product information
- Shipping information
- Related products
- Customer reviews

Create a sophisticated image viewing experience.

==================================================
WISHLIST
==================================================

Create a wishlist page.

Display:
- Product image
- Product name
- Price
- Availability
- Remove button
- Add to cart button

Use mock data for now.

==================================================
CART
==================================================

Create a complete cart experience.

Display:
- Product
- Image
- Variant
- Size
- Quantity
- Price
- Remove
- Subtotal

Order summary:
Subtotal
Delivery Fee
VAT
Total

Create:
Continue Shopping
Proceed to Checkout

For now, use mock calculations.

==================================================
BLANK TEE CUSTOMIZATION
==================================================

Create a premium "Customize Your Tee" experience.

Customer should be able to:
1. Select blank tee
2. Select size
3. Select color
4. Select quantity
5. Upload design
6. Add additional instructions
7. Add customized tee to cart

The frontend should include:
- Drag-and-drop upload area
- File upload button
- Uploaded file preview
- Remove file button
- Additional information textarea
- Size selector
- Color selector
- Quantity selector
- Price summary
- Add to Cart button

For now, the upload functionality can use frontend/mock behavior.
The actual secure file storage will be implemented later using Supabase.

==================================================
CHECKOUT
==================================================

Create a multi-step checkout interface.

STEP 1:
Customer information
- Full name
- Email
- Phone

STEP 2:
Delivery information
- Address
- City
- State
- Selected delivery/pickup location

STEP 3:
Order summary
- Products
- Subtotal
- Delivery fee
- VAT
- Total

STEP 4:
Payment information

Display a professional manual bank transfer payment interface.

For now, use placeholder/mock bank information.

Example:
Account Name:
KH Luxury

Bank:
Example Bank

Account Number:
0000000000

Clearly explain:
"After making your transfer, upload your payment receipt for verification."

STEP 5:
Payment receipt upload interface.

Show:
- Upload receipt
- Preview receipt
- Submit receipt

For now, this is frontend/mock functionality.

==================================================
ORDER CONFIRMATION
==================================================

Create a beautiful order confirmation page.

Display:
Order Successful
Order Number
Payment Status:
Pending Verification

Message:
"Your payment receipt has been submitted and is awaiting verification."

Show:
- Order summary
- Total
- Delivery information
- Expected delivery date
- Payment status

==================================================
CUSTOMER ACCOUNT
==================================================

Create a customer dashboard.

Sections:
Overview
Orders
Wishlist
Profile
Reviews
Settings

Dashboard should display:
- Recent orders
- Order statuses
- Total orders
- Wishlist count
- Recent activity

Use realistic mock data.

==================================================
ORDER DETAILS
==================================================

Create an order details page.

Display:
Order ID
Order date
Products
Quantity
Price
Subtotal
VAT
Delivery fee
Total
Delivery address
Delivery location
Expected delivery date
Payment status
Order status

Use a visual order progress tracker.

Example:
Order Placed
↓
Payment Verification
↓
Payment Confirmed
↓
Processing
↓
Out for Delivery
↓
Delivered

==================================================
REVIEWS
==================================================

Create customer review interface.

Include:
- Star rating
- Review textarea
- Optional image upload
- Submit Review

Use mock data for now.

==================================================
ABOUT PAGE
==================================================

Create a premium editorial About page.

Include:
- KH Luxury logo
- Brand story
- Vision
- Philosophy
- Fashion imagery
- Social media handles

The page should feel like a luxury fashion editorial rather than a normal company About page.

==================================================
CONTACT
==================================================

Create a Contact page with:
- WhatsApp
- Email
- Social media
- Contact form
- Brand information

Add a floating WhatsApp button throughout the website.

==================================================
ADMIN FRONTEND
==================================================

Create the complete ADMIN UI as well.
Do not implement real admin authentication yet.

Create the frontend screens that will later connect to Supabase.

Admin pages:
Dashboard
Products
Add Product
Edit Product
Categories
Orders
Order Details
Customers
Payments
Payment Receipts
Delivery Locations
Reviews
Brand Settings
Payment Settings
WhatsApp Settings
Admin Profile
Security Settings

==================================================
ADMIN DASHBOARD
==================================================

Create a premium but functional admin dashboard.

Display:
Total Products
Total Customers
Total Orders
Pending Payments
Confirmed Payments
Revenue
Pending Orders
Completed Orders

Include:
- Recent orders
- Recent customers
- Payment activity
- Sales overview
- Order status overview

Use charts where useful.

Keep the dashboard professional and easy to operate.

==================================================
ADMIN PRODUCT MANAGEMENT
==================================================

Create:
Product list
Add product
Edit product
Delete product
Product details

Add product form should contain:
Product name
Description
Price
Category
Images
Sizes
Colors
Stock
Featured
New Arrival
Customizable

Use mock data.

==================================================
ADMIN ORDER MANAGEMENT
==================================================

Create an order management table.

Columns:
Order ID
Customer
Date
Amount
Payment Status
Order Status
Actions

Create detailed order page.

==================================================
ADMIN PAYMENT MANAGEMENT
==================================================

Create payment management interface.

Display:
Order ID
Customer
Amount
Receipt
Payment Date
Payment Status
Action

Admin actions:
View Receipt
Confirm Payment
Reject Payment
Request New Receipt

For now, these actions can use mock state.

==================================================
ADMIN DELIVERY LOCATIONS
==================================================

Create UI for:
Add Location
Edit Location
Delete Location
Enable/Disable Location

Fields:
Location Name
Address
Delivery Fee
Description
Status

==================================================
ADMIN SETTINGS
==================================================

Create settings pages for:
Brand Information
Payment Account
WhatsApp
Delivery
Profile
Security

Payment settings should contain:
Account Name
Bank Name
Account Number
Payment Instructions

Again, use mock data for now.

==================================================
RESPONSIVE DESIGN
==================================================

The entire application must be responsive.

Desktop:
Premium full-width layouts.

Tablet:
Adaptive layouts.

Mobile:
Excellent mobile-first experience.

Ensure:
- Navigation works
- Product grids adapt
- Checkout works
- Forms are usable
- Tables become mobile-friendly
- Admin dashboard works on mobile
- Buttons remain accessible

==================================================
LOADING / EMPTY / ERROR STATES
==================================================

Create polished:
- Loading states
- Skeleton loaders
- Empty states
- Error states
- Success messages
- Toast notifications
- Confirmation modals

Examples:
Empty Cart
Empty Wishlist
No Orders
No Search Results
No Products

==================================================
IMPORTANT FRONTEND RULE
==================================================

Do NOT connect Supabase yet.
Do NOT create database tables.
Do NOT create RLS policies.
Do NOT implement real authentication.
Do NOT implement real payment processing.
Do NOT create backend APIs.

Use clean mock data and frontend state where necessary.
However, structure the components and data models in a way that makes replacing mock data with Supabase later straightforward.

==================================================
FINAL FRONTEND GOAL
==================================================

When this frontend build is complete, I should be able to navigate through the entire KH Luxury customer and admin experience visually.

The frontend should feel like a real premium luxury fashion application.

It should NOT look like an AI-generated template.

Prioritize:
Luxury
Elegance
Usability
Visual storytelling
Strong typography
Premium imagery
Responsive design
Smooth interactions
Clean architecture

The result should be a complete frontend foundation ready for Supabase integration later.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9e6dc410-3841-419d-9599-a71661a3ce1f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

This is a client-rendered React SPA using React Router DOM. Route definitions live
in [`src/router.tsx`](./src/router.tsx). Configure production hosting to serve
`index.html` for application routes so direct visits to nested URLs continue to
work.

```sh
npm run typecheck
npm run build
```
