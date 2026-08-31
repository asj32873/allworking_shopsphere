# Gateway Route Map

| Public route | Service | Port |
|---|---|---:|
| /api/auth/* | auth | 5002 |
| /api/users/* | user | 5007 |
| /api/products/* | product | 5003 |
| /api/cart/* | cart | 5004 |
| /api/orders/* | order | 5005 |
| /api/payments/* | payment | 5006 |
| /api/addresses/* | address | 5008 |
| /api/reviews/* | review | 5009 |
| /api/rag/* | rag | 5010 |
| /api/issues/* | support | 5011 |
| /api/vendor/* | vendor | 5012 |
| /api/admin/* | admin | 5013 |

Special routes:
- GET /api/health -> gateway health
- POST /api/payments/webhook -> payment service, raw Stripe body
- POST /api/payment-debug -> gateway compatibility/debug endpoint
