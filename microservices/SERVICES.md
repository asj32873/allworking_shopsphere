# Service ownership

| Service | Port | Primary ownership |
|---|---:|---|
| API Gateway | 5001 | Edge routing only |
| Auth | 5002 | User identity/authentication + User model |
| Product | 5003 | Product catalog + stock |
| Cart | 5004 | Cart items |
| Order | 5005 | Orders, order items, status history |
| Payment | 5006 | Stripe payments + Payment model |
| User | 5007 | Profile API over Auth-owned user identity |
| Address | 5008 | Addresses |
| Review | 5009 | Reviews and rating calculation |
| RAG | 5010 | Product Q&A, embeddings, LangGraph, Chroma |
| Support | 5011 | Customer issues |
| Vendor | 5012 | Vendor profiles |
| Admin | 5013 | Admin orchestration across domain APIs |
