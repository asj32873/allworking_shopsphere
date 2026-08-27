# ShopSphere Backend — MongoDB + Mongoose

REST API backend for the React multi-vendor e-commerce frontend.

## Stack

- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- bcrypt password hashing
- Zod request validation

## Setup

```bash
cd ecommerce-backend-mongodb
npm install
cp .env.example .env
npm run seed
npm run dev
```

API base URL:

```text
http://localhost:5000/api
```

Health check:

```text
GET http://localhost:5000/api/health
```

## Seed accounts

```text
User:
user@example.com
user123

Vendor:
vendor@example.com
vendor123

Admin:
admin@example.com
admin123

Pending vendor:
pending@example.com
vendor123
```

The seeded vendor is already VERIFIED. The pending vendor remains APPLIED.

## Frontend integration

Create a frontend API client with:

```js
const API_URL = "http://localhost:5000/api";
```

Send the JWT using:

```text
Authorization: Bearer <token>
```

## Main API groups

```text
/auth
/users
/products
/cart
/orders
/reviews
/issues
/vendor
/admin
/addresses
```

## Notes

The API uses separate MongoDB collections for users, vendors, addresses, products, cart items, orders, order items, order status history, reviews, and customer issues.

For production checkout/inventory consistency, run MongoDB as a replica set and wrap order creation + stock decrement in a MongoDB transaction.
