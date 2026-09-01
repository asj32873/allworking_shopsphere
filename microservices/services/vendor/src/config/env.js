require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../.env') });

function getEnv(name, fallback = undefined) {
  return process.env[name] ?? fallback;
}

module.exports = { getEnv };
