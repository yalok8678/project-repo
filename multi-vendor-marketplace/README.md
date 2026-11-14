# MarketHub — Multi-Vendor E-Commerce Marketplace

A MERN-stack marketplace MVP with customer, vendor and admin roles.

## Included
- JWT registration/login and role-based authorization
- Vendor applications and admin approval
- Product CRUD and catalog search/filter/sort
- AWS S3 image uploads (credentials required)
- Redis cart with in-memory development fallback
- Elasticsearch indexing/search with MongoDB text-search fallback
- Multi-vendor order grouping and commission calculation
- Razorpay test checkout and server-side signature verification
- COD checkout
- Coupons, purchase-verified reviews, PDF invoices
- Admin dashboard and monthly revenue/commission aggregation
- Responsive React storefront, customer account, vendor center and admin center

## Requirements
- Node.js 20+
- MongoDB Community Server running locally
- Optional: Redis, Elasticsearch, AWS S3 bucket, Razorpay test account

## Setup
1. Copy `backend/.env.example` to `backend/.env`.
2. Set a JWT secret of at least 32 characters and verify `MONGODB_URI`.
3. For Razorpay, add test `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
4. For S3 image uploads, configure the AWS region, bucket and credentials.
5. Terminal 1:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
6. Create an admin (configure ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env):
   ```bash
   npm run admin:create
   ```
7. Terminal 2: copy `frontend/.env.example` to `frontend/.env`, then:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
8. Open http://localhost:5173

## Demo workflow
1. Register a customer.
2. Register a second account and submit a vendor application.
3. Sign in as the bootstrapped admin and approve the vendor.
4. Sign back in as the vendor and create products.
5. Shop as a customer, add items to cart and checkout.
6. For Razorpay, use test credentials and test payment methods from Razorpay's documentation. COD can be used without gateway credentials.

## API base
`http://localhost:5000/api`

Main endpoints:
- POST `/auth/register`, POST `/auth/login`, GET `/auth/me`
- POST `/vendors/apply`, GET `/vendors/me`, GET `/vendors`, PATCH `/vendors/:id/approve`
- GET/POST `/products`, GET/PATCH/DELETE `/products/:id`
- GET/POST `/cart`, PATCH/DELETE `/cart/:productId`
- POST `/orders/checkout`, GET `/orders/mine`, GET `/orders/vendor`
- POST `/payments/verify`
- GET/POST `/coupons`, POST `/coupons/validate`
- GET/POST `/reviews/:productId`
- GET `/invoices/:id`
- GET `/admin/dashboard`

## Important production notes
This is an educational/demo MVP, not a production-ready marketplace payment platform. Razorpay checkout and signature verification are implemented, but commission is only calculated and recorded. Actual vendor payouts require Razorpay Route/platform onboarding and linked vendor accounts. Before production, add payment webhooks with idempotency, MongoDB transactions or robust stock reservation expiry, coupon atomicity, refund/cancellation flows, tax-compliant invoices, audit logs, stronger validation, CSRF protection if cookie auth is used, monitoring, and deployment secrets. Never commit `.env`.
