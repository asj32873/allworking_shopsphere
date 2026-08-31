# ShopSphere Microservices Backend v3

This backend is intentionally structured as independently runnable services. The existing frontend stays unchanged and talks only to the API Gateway on port 5001.

## Services

| Service | Port | Owns |
|---|---:|---|
| API Gateway | 5001 | routing only; no domain models |
| Auth | 5002 | authentication, User identity, vendor registration |
| Product | 5003 | Product catalog and product Q&A entrypoint |
| Cart | 5004 | CartItem |
| Order | 5005 | Order, OrderItem, OrderStatusHistory |
| Payment | 5006 | Payment and Stripe integration |
| User | 5007 | profile facade over Auth identity service |
| Address | 5008 | Address |
| Review | 5009 | Review and rating coordination |
| RAG | 5010 | LangGraph, Chroma, embeddings, product documents |
| Support | 5011 | CustomerIssue |
| Vendor | 5012 | Vendor profile/dashboard facade |
| Admin | 5013 | admin orchestration/facade |

## Important architecture rule

No service imports another service's domain model. Cross-service operations use HTTP through each service's local `src/utils/serviceClient.js` and protected internal endpoints. There is no shared implementation directory.

## Frontend contract

The frontend continues using `http://localhost:5001/api/...`.
The gateway preserves the legacy API paths and forwards them to the owning service.

## Body forwarding

Normal JSON requests are parsed at the gateway and forwarded with `fixRequestBody` from `http-proxy-middleware`. The Stripe webhook is registered before JSON parsing and uses `express.raw()` so the exact Stripe payload remains available for signature verification.

## Run

1. Copy `.env.example` to `.env`.
2. Put your existing secrets into `.env`.
3. Make sure MongoDB is running.
4. Run `npm run install:all`.
5. Run `npm run start:all`.
6. Keep the frontend pointed at port 5001.

The gateway is the only public application endpoint in local development. Services also listen on localhost for development/testing.
