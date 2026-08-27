# React frontend -> backend mapping

The existing React `AppContext.jsx` currently stores application state in localStorage/dummy data.
Replace those methods with calls to these APIs.

## Authentication

```text
login(email,password)
POST /api/auth/login
```

Store the returned token and user.

```text
GET /api/auth/me
Authorization: Bearer <token>
```

## Products

```text
GET /api/products?q=Sony&brand=Sony&category=AUDIO&minPrice=500&maxPrice=1200&rating=4&stock=in&sort=low&page=1&limit=9
GET /api/products/:id
```

Map backend `imageUrl` to the frontend's current `image` property or update `ProductCard` to use `imageUrl`.

## Cart

```text
GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/:cartItemId
DELETE /api/cart/items/:cartItemId
```

POST body:

```json
{
  "productId": "<product id>",
  "quantity": 2
}
```

## Addresses

```text
GET    /api/addresses
POST   /api/addresses
PUT    /api/addresses/:id
DELETE /api/addresses/:id
PATCH  /api/addresses/:id/default
```

## Orders

```text
POST /api/orders
GET  /api/orders
GET  /api/orders/:id
GET  /api/orders/:id/tracking
```

Create order:

```json
{
  "addressId": "<address id>"
}
```

## Reviews

```text
GET    /api/reviews/product/:productId
POST   /api/reviews/product/:productId
PUT    /api/reviews/:id
DELETE /api/reviews/:id
```

POST body:

```json
{
  "rating": 5,
  "review": "Excellent product."
}
```

## Issues

```text
POST  /api/issues
GET   /api/issues
GET   /api/issues/:id
PATCH /api/issues/:id
```

## Vendor

```text
GET    /api/vendor/dashboard
GET    /api/vendor/profile
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
PATCH  /api/products/:id/stock
GET    /api/orders/vendor/list
PATCH  /api/orders/vendor/:orderId/items/:itemId/status
```

## Admin

```text
GET    /api/admin/dashboard
GET    /api/admin/vendors
PATCH  /api/admin/vendors/:id/approve
PATCH  /api/admin/vendors/:id/reject
DELETE /api/admin/vendors/:id
GET    /api/admin/users
PATCH  /api/admin/users/:id/status
GET    /api/admin/issues
GET    /api/orders/admin/list
PATCH  /api/orders/admin/:orderId/items/:itemId/status
```

## Important frontend change

The current frontend's `AppContext` has methods such as `addToCart`, `placeOrder`, `approveVendor`, etc. These are currently local state operations.

For the real backend, make `AppContext` call the REST endpoints and keep only authentication/session/UI state in React.
