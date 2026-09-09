const { redis } = require("./redis.service");

const DEFAULT_TTL = Number(process.env.REDIS_PRODUCT_TTL || 300);

async function get(key) {
  try {
    const value = await redis.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error(`[CACHE] GET ${key} failed:`, error.message);

    // Cache failure should never break the API.
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

async function delByPattern(pattern) {
  try {
    let cursor = 0;

    do {
      const result = await redis.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });

      cursor = result.cursor;

      if (result.keys.length) {
        await redis.del(result.keys);
      }
    } while (cursor !== 0);

    return true;
  } catch (error) {
    console.error(`[CACHE] DELETE PATTERN ${pattern} failed:`, error.message);

    return false;
  }
}

module.exports = {
  get,
  set,
  del,
  delByPattern,
};
