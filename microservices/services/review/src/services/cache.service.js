const { redis } = require("./redis.service");

const DEFAULT_TTL = Number(process.env.REDIS_REVIEW_TTL || 300);

async function get(key) {
  try {
    const value = await redis.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error(`[CACHE] GET ${key} failed:`, error.message);
    return null;
  }
}

async function set(key, value, ttl = DEFAULT_TTL) {
  try {
    await redis.set(key, JSON.stringify(value), {
      EX: ttl,
    });

    return true;
  } catch (error) {
    console.error(`[CACHE] SET ${key} failed:`, error.message);
    return false;
  }
}

async function del(key) {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`[CACHE] DELETE ${key} failed:`, error.message);
    return false;
  }
}

module.exports = {
  get,
  set,
  del,
};
