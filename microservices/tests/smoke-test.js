/*
 * ShopSphere Microservices Smoke / Integration Test Runner
 *
 * Run from the microservices project root:
 *
 *   node tests/smoke-test.js
 *
 * Optional:
 *   $env:TEST_USER_EMAIL="..."
 *   $env:TEST_USER_PASSWORD="..."
 *   $env:TEST_VENDOR_TOKEN="..."
 *   $env:TEST_ADMIN_TOKEN="..."
 */

const BASE = {
  gateway: process.env.GATEWAY_URL || "http://localhost:5001",
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:5002",
  product: process.env.PRODUCT_SERVICE_URL || "http://localhost:5003",
  cart: process.env.CART_SERVICE_URL || "http://localhost:5004",
  order: process.env.ORDER_SERVICE_URL || "http://localhost:5005",
  payment: process.env.PAYMENT_SERVICE_URL || "http://localhost:5006",
  user: process.env.USER_SERVICE_URL || "http://localhost:5007",
  address: process.env.ADDRESS_SERVICE_URL || "http://localhost:5008",
  review: process.env.REVIEW_SERVICE_URL || "http://localhost:5009",
  rag: process.env.RAG_SERVICE_URL || "http://localhost:5010",
  support: process.env.SUPPORT_SERVICE_URL || "http://localhost:5011",
  vendor: process.env.VENDOR_SERVICE_URL || "http://localhost:5012",
  admin: process.env.ADMIN_SERVICE_URL || "http://localhost:5013",
};

let passed = 0;
let failed = 0;
const failures = [];

async function request(url, options = {}) {
  const started = Date.now();

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });

    const text = await response.text();

    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    return {
      ok: response.ok,
      status: response.status,
      body,
      ms: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: null,
      ms: Date.now() - started,
      error: error.message,
    };
  }
}

async function check(name, url, expectedStatuses = [200], options = {}) {
  const result = await request(url, options);
  const ok = expectedStatuses.includes(result.status);

  if (ok) {
    passed++;
    console.log(`✓ ${name}  [${result.status}] ${result.ms}ms`);
  } else {
    failed++;
    failures.push({ name, url, result });
    console.log(`✗ ${name}  [${result.status}] ${result.ms}ms`);

    if (result.error) {
      console.log(`  Error: ${result.error}`);
    } else if (result.body) {
      console.log(`  Response: ${JSON.stringify(result.body)}`);
    }
  }

  return result;
}

async function run() {
  console.log("");
  console.log("==============================================");
  console.log("   SHOPSPHERE MICROSERVICES TEST SUITE");
  console.log("==============================================");
  console.log("");

  console.log("SERVICE HEALTH");
  console.log("----------------------------------------------");

  const healthServices = [
    ["Gateway", BASE.gateway],
    ["Auth", BASE.auth],
    ["Product", BASE.product],
    ["Cart", BASE.cart],
    ["Order", BASE.order],
    ["Payment", BASE.payment],
    ["User", BASE.user],
    ["Address", BASE.address],
    ["Review", BASE.review],
    ["RAG", BASE.rag],
    ["Support", BASE.support],
    ["Vendor", BASE.vendor],
    ["Admin", BASE.admin],
  ];

  for (const [name, url] of healthServices) {
    await check(`${name} health`, `${url}/health`);
  }

  console.log("");
  console.log("GATEWAY ROUTING");
  console.log("----------------------------------------------");

  await check(
    "Gateway → Product",
    `${BASE.gateway}/api/products`,
    [200]
  );

  await check(
    "Gateway → Cart",
    `${BASE.gateway}/api/cart`,
    [200, 401, 403],
    {
      headers: process.env.TEST_USER_TOKEN
        ? { Authorization: `Bearer ${process.env.TEST_USER_TOKEN}` }
        : {},
    }
  );

  await check(
    "Gateway → Orders",
    `${BASE.gateway}/api/orders`,
    [200, 401, 403],
    {
      headers: process.env.TEST_USER_TOKEN
        ? { Authorization: `Bearer ${process.env.TEST_USER_TOKEN}` }
        : {},
    }
  );

  await check(
    "Gateway → Addresses",
    `${BASE.gateway}/api/addresses`,
    [200, 401, 403],
    {
      headers: process.env.TEST_USER_TOKEN
        ? { Authorization: `Bearer ${process.env.TEST_USER_TOKEN}` }
        : {},
    }
  );

  await check(
    "Gateway → Reviews",
    `${BASE.gateway}/api/reviews`,
    [200, 401, 403]
  );

  await check(
    "Gateway → Payment",
    `${BASE.gateway}/api/payments`,
    [200, 401, 403, 404]
  );

  await check(
    "Gateway → Support",
    `${BASE.gateway}/api/issues`,
    [200, 401, 403]
  );

  console.log("");
  console.log("AUTHENTICATION");
  console.log("----------------------------------------------");

  const email =
    process.env.TEST_USER_EMAIL ||
    `smoke-${Date.now()}@example.com`;

  const password =
    process.env.TEST_USER_PASSWORD ||
    "SmokeTest123456!";

  const register = await check(
    "Auth register",
    `${BASE.gateway}/api/auth/register`,
    [200, 201, 409],
    {
      method: "POST",
      body: JSON.stringify({
        name: "ShopSphere Smoke Test User",
        email,
        phone: "9000000001",
        password,
      }),
    }
  );

  let token = process.env.TEST_USER_TOKEN || null;

  const login = await check(
    "Auth login",
    `${BASE.gateway}/api/auth/login`,
    [200, 201, 401, 403],
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  if (login.body && typeof login.body === "object") {
    token =
      login.body.token ||
      login.body.accessToken ||
      login.body.data?.token ||
      login.body.data?.accessToken ||
      token;
  }

  if (token) {
    await check(
      "Auth /me",
      `${BASE.gateway}/api/auth/me`,
      [200],
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    await check(
      "Protected request without token rejected",
      `${BASE.gateway}/api/auth/me`,
      [401, 403]
    );
  } else {
    console.log("  ! Could not extract login token; /me test skipped.");
  }

  console.log("");
  console.log("PRODUCT");
  console.log("----------------------------------------------");

  const products = await check(
    "Product list via service",
    `${BASE.product}/api/products`,
    [200]
  );

  await check(
    "Product list via gateway",
    `${BASE.gateway}/api/products`,
    [200]
  );

  let productId = null;

  if (products.body && typeof products.body === "object") {
    const list =
      products.body.products ||
      products.body.data ||
      products.body.items ||
      (Array.isArray(products.body) ? products.body : []);

    if (Array.isArray(list) && list.length) {
      productId = list[0]._id || list[0].id;
    }
  }

  if (productId) {
    await check(
      "Get product via service",
      `${BASE.product}/api/products/${productId}`,
      [200]
    );

    await check(
      "Get product via gateway",
      `${BASE.gateway}/api/products/${productId}`,
      [200]
    );
  } else {
    console.log("  ! No product ID found; individual product test skipped.");
  }

  console.log("");
  console.log("OPTIONAL TOKEN TESTS");
  console.log("----------------------------------------------");

  if (process.env.TEST_VENDOR_TOKEN) {
    await check(
      "Vendor protected endpoint",
      `${BASE.gateway}/api/vendor`,
      [200, 401, 403, 404],
      {
        headers: {
          Authorization: `Bearer ${process.env.TEST_VENDOR_TOKEN}`,
        },
      }
    );
  } else {
    console.log("  - TEST_VENDOR_TOKEN not supplied; vendor test skipped.");
  }

  if (process.env.TEST_ADMIN_TOKEN) {
    await check(
      "Admin protected endpoint",
      `${BASE.gateway}/api/admin`,
      [200, 401, 403, 404],
      {
        headers: {
          Authorization: `Bearer ${process.env.TEST_ADMIN_TOKEN}`,
        },
      }
    );
  } else {
    console.log("  - TEST_ADMIN_TOKEN not supplied; admin test skipped.");
  }

  console.log("");
  console.log("==============================================");
  console.log(`PASS: ${passed}`);
  console.log(`FAIL: ${failed}`);
  console.log("==============================================");

  if (failures.length) {
    console.log("");
    console.log("FAILURES");
    console.log("----------------------------------------------");

    for (const failure of failures) {
      console.log(`✗ ${failure.name}`);
      console.log(`  ${failure.url}`);
      console.log(`  HTTP ${failure.result.status}`);

      if (failure.result.error) {
        console.log(`  ${failure.result.error}`);
      } else if (failure.result.body) {
        console.log(`  ${JSON.stringify(failure.result.body)}`);
      }
    }
  }

  console.log("");

  process.exitCode = failed ? 1 : 0;
}

run().catch((error) => {
  console.error("Test runner crashed:", error);
  process.exitCode = 1;
});
