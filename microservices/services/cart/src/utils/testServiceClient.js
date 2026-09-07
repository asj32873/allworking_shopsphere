require("dotenv").config();

const { getJson, postJson } = require("./serviceClient");

const SERVICE_URL = "http://localhost:5004";

async function testTimeout() {
  console.log("\n==============================");
  console.log("TESTING TIMEOUT");
  console.log("==============================\n");

  const startedAt = Date.now();

  try {
    const result = await getJson(SERVICE_URL, "/test/slow");

    console.log("\nResult:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("\nTimeout test failed:");
    console.error(error);
  }

  console.log(`\nElapsed time: ${Date.now() - startedAt}ms`);
}

async function testPostRetrySafe() {
  console.log("\n==============================");
  console.log("TESTING POST WITH retrySafe: true");
  console.log("==============================\n");

  const startedAt = Date.now();

  try {
    const result = await postJson(
      SERVICE_URL,
      "/test/post-retry",
      {
        name: "Test",
      },
      {},
      {
        retrySafe: true,
      },
    );

    console.log("\nResult:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("\nPOST retry test failed:");
    console.error(error);
  }

  console.log(`\nElapsed time: ${Date.now() - startedAt}ms`);
}

async function runTests() {
  await testTimeout();
  await testPostRetrySafe();
}

runTests().catch(console.error);
