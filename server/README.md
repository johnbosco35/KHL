# KH Luxury API

Express 5 + TypeScript REST API (MVC) on MongoDB. It mirrors every action in the
frontend's mock store (`src/lib/app-store.tsx`), so the storefront and admin can switch to it screen by screen.

## Setup

```bash
cd server
npm install
cp .env.example .env        # fill in MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:migrate          # connect and create indexes (safe to re-run)
npm run db:seed             # admin, categories, delivery locations, catalogue, settings
npm run db:seed -- --demo   # optional: demo customers/orders/reviews (password: password123)
npm run dev                 # http://localhost:4100/api
```

`MONGODB_URI` can point to a local MongoDB instance (`mongodb://127.0.0.1:27017/kh_luxury`)
or a MongoDB Atlas cluster (`mongodb+srv://...`). Transactions used during checkout require a
replica set, which Atlas provides by default; configure a local replica set if you develop against
a standalone MongoDB server.
If Node reports `querySrv ECONNREFUSED` for an Atlas `mongodb+srv://` URI, use Atlas's standard
multi-host `mongodb://` URI or fix the machine's DNS resolver so it can resolve SRV records.

Production: `npm run build && npm start`.

## Connecting the storefront

The frontend talks to this API through `src/lib/api.ts`, using `VITE_API_URL`
(default `http://localhost:4100/api`).

1. Start the API (`npm run dev` in `server/`). Check http://localhost:4100/api/health shows
   `"service":"kh-luxury-api"`.
2. In the project root, run `npm run dev` and open http://localhost:8080. If your API isn't on port 4100,
   copy `.env.example` to `.env.local`, set `VITE_API_URL`, and restart Vite.
3. In development any `localhost` origin may call the API. In production, list the storefront's address
   in `CORS_ORIGIN`.

If the storefront says "is not the KH Luxury API", some other program owns that port. Change `PORT`
here and `VITE_API_URL` to match.

**Deploying:** host the API somewhere public (Render, Railway, Fly…). Set its `API_URL`, `APP_URL` and
`CORS_ORIGIN` to the public addresses, then set `VITE_API_URL` on the frontend host (Vercel / Lovable)
and rebuild. A deployed storefront can't reach `localhost`.

- **Database:** set `MONGODB_URI` to your MongoDB connection string. The API creates its indexes on startup.
- **Uploads:** files are saved under `server/uploads` and served at `/uploads`.
- **Email:** password-reset emails use Resend when `RESEND_API_KEY` is set. Otherwise the link is printed
  in the console, and outside production it's also returned as `devResetUrl`.

## Conventions

- Auth: `Authorization: Bearer <token>`. Login, register and reset-password return `{ user, token }`.
- Money is whole naira (integers). VAT is 7.5%, as in the frontend.
- Errors: `{ error: "message", details?: { field: "message" } }` with a matching HTTP status.
- Files (receipts, images, custom designs) are sent as data URLs in JSON (max 8 MB each). The API
  stores them and saves the URL in their place. A receipt's `dataUrl` field holds that URL.

## Endpoints (all under `/api`)

| | Method & path | Who |
|---|---|---|
| **Auth** | `POST /auth/register` `{name,email,phone,password}` | public |
| | `POST /auth/login` `{email,password,role?}` (role defaults to `customer`) | public |
| | `POST /auth/forgot-password` `{email,role?}` · `POST /auth/reset-password` `{token,password}` | public |
| | `GET /auth/me` · `PATCH /auth/me` `{name?,email?,phone?}` · `POST /auth/me/password` `{currentPassword,newPassword}` | signed in |
| **Products** | `GET /products?category=&q=&featured=&newArrival=&customizable=` → `{products, ratings}` | public (active only); admin sees all, `?status=` |
| | `GET /products/:id` → `{product, reviews}` | public |
| | `POST /products` · `PUT /products/:id` · `DELETE /products/:id` | admin |
| **Categories** | `GET /categories` · `POST` · `PUT /:id` (a rename updates its products) · `DELETE /:id` (blocked while products use it) | public / admin |
| **Delivery** | `GET /delivery-locations` · `POST` · `PUT /:id` · `DELETE /:id` | public / admin |
| **Reviews** | `GET /reviews?productId=` (approved; admin: any, `?status=`) · `GET /reviews/mine` · `POST /reviews` | public / customer |
| | `PATCH /reviews/:id/status` `{status}` · `DELETE /reviews/:id` | admin |
| **Bag** | `GET /cart` · `POST /cart` `{productId,size?,color?,quantity?,customization?}` · `PATCH /cart/:key` `{quantity}` · `DELETE /cart/:key` · `DELETE /cart` | customer |
| **Wishlist** | `GET /wishlist` · `PUT /wishlist/:productId` · `DELETE /wishlist/:productId` | customer |
| **Orders** | `POST /orders` `{contact, delivery:{address,city,state,locationId}}`: turns the bag into an order and payment, checks and reduces stock | customer |
| | `GET /orders` (own; admin: all) · `GET /orders/:id` → `{order, payment}` | signed in |
| | `POST /orders/:id/receipt` `{name,type,dataUrl}`: payment moves to pending verification and the bag is cleared | customer |
| | `PATCH /orders/:id/status` `{status}` | admin |
| **Payments** | `GET /payments?status=` (own; admin: all) · `GET /payments/:id` → `{payment, order}` | signed in |
| | `POST /payments/:id/actions` `{action: confirm\|reject\|resubmit, note?}` | admin |
| **Settings** | `GET /settings` (brand, payment, whatsapp) · `GET /settings/:key` | public |
| | `PUT /settings/:key` (partial update) | admin |
| **Newsletter** | `POST /newsletter` `{email}` | public |
| | `GET /newsletter` · `DELETE /newsletter/:email` | admin |
| **Uploads** | `POST /uploads` `{dataUrl, folder?}` → `{url}` | signed in |
| **Admin** | `GET /admin/stats` · `GET /admin/customers` · `GET /admin/customers/:id` · `PATCH /admin/customers/:id/status` `{status}` | admin |

Suspended accounts can't sign in, and their existing tokens stop working straight away.
