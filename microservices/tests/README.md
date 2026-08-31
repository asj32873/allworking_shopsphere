# ShopSphere Microservices Tests

This folder contains the lightweight test runner for the local ShopSphere
microservices backend.

## Run from the microservices root

```powershell
node tests/smoke-test.js
```

## Optional npm scripts

Add these to the root `package.json`:

```json
{
  "scripts": {
    "test": "node tests/smoke-test.js",
    "test:health": "node tests/smoke-test.js",
    "test:gateway": "node tests/smoke-test.js",
    "test:integration": "node tests/smoke-test.js"
  }
}
```

## Optional tokens

For deeper protected-route checks in PowerShell:

```powershell
$env:TEST_USER_TOKEN="<user-jwt>"
$env:TEST_VENDOR_TOKEN="<vendor-jwt>"
$env:TEST_ADMIN_TOKEN="<admin-jwt>"
```

Do not put real tokens in this folder or commit them to Git.

## Important

Run all required services before running the test:

- Gateway: 5001
- Auth: 5002
- Product: 5003
- Cart: 5004
- Order: 5005
- Payment: 5006
- User: 5007
- Address: 5008
- Review: 5009
- RAG: 5010
- Support: 5011
- Vendor: 5012
- Admin: 5013

The runner uses Node.js built-in `fetch`; no Jest/Supertest installation is required.
