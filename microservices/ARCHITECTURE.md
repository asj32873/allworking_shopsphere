# ShopSphere Microservices v3

## Boundary rule
Each service owns its domain code and models. There is intentionally no `shared/` implementation directory.

## Ports
- API Gateway 5001
- Auth 5002
- Product 5003
- Cart 5004
- Order 5005
- Payment 5006
- User 5007
- Address 5008
- Review 5009
- RAG 5010
- Support 5011
- Vendor 5012
- Admin 5013

## Communication
- Browser -> API Gateway only.
- Gateway -> service via HTTP proxy.
- Service -> service via HTTP using `INTERNAL_SERVICE_TOKEN`.
- No service imports another service's models/controllers/middleware.

## Data ownership
Each domain model is located in its owning service. Development may use one MongoDB URI for convenience, but application code treats service data as private and only accesses another service through its API.

## Request body rule
The gateway parses normal JSON requests and calls `fixRequestBody` before proxying. Stripe's webhook route is registered before JSON parsing and preserves the raw request body for signature verification.
