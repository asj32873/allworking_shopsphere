# ShopSphere corrected frontend

Frontend-only V1 using React, React Router, Bootstrap and Context with dummy data.

## Run
npm install
npm run dev

## Demo accounts
User: user@example.com / user123
Vendor: vendor@example.com / vendor123
Admin: admin@example.com / admin123
Pending vendor: pending@example.com / vendor123

## Key correction
Vendor order status is updated per order item, not for the whole multi-vendor order. A vendor can update only order items whose vendorId matches the logged-in vendor. Valid operational transitions are PLACED -> CONFIRMED -> PACKED -> DISPATCHED -> OUT_FOR_DELIVERY -> DELIVERED.

Also included: vendor registration/approval, product CRUD, stock editing, product filters + pagination, cart/address selection, order tracking, reviews, issue management, admin order management, user management and review moderation.
