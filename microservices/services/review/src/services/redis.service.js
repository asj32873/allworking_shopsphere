const { createClient } = require("redis");

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.on("error", (error) => {
  console.error("[REDIS] Error:", error.message);
});

redis.on("connect", () => {
  console.log("[REDIS] Connecting...");
});

redis.on("ready", () => {
  console.log("[REDIS] Ready");
});

redis.on("reconnecting", () => {
  console.log("[REDIS] Reconnecting...");
});

let connected = false;

async function connectRedis() {
  if (connected) return;

  await redis.connect();
  connected = true;
}

async function disconnectRedis() {
  if (!connected) return;

  await redis.quit();
  connected = false;
}

module.exports = {
  redis,
  connectRedis,
  disconnectRedis,
};
