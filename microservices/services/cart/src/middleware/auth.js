const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { getJson } = require('../utils/serviceClient');

const auth0Domain = (process.env.AUTH0_DOMAIN || '')
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');
const auth0Audience = process.env.AUTH0_AUDIENCE;
const auth0Issuer = auth0Domain ? `https://${auth0Domain}/` : null;
const jwks = auth0Domain
  ? jwksClient({
      jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    })
  : null;

function signingKey(header, callback) {
  if (!jwks) return callback(new Error('Auth0 is not configured.'));
  if (!header?.kid) return callback(new Error('Token is missing kid.'));
  jwks.getSigningKey(header.kid)
    .then((key) => callback(null, key.getPublicKey()))
    .catch(callback);
}

function verifyAuth0(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      signingKey,
      { algorithms: ['RS256'], audience: auth0Audience, issuer: auth0Issuer },
      (error, payload) => (error ? reject(error) : resolve(payload)),
    );
  });
}

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const token = header.slice(7);
    let identity;

    if (auth0Domain && auth0Audience && token.split('.').length === 3) {
      try {
        identity = await verifyAuth0(token);
      } catch {
        identity = null;
      }
    }

    if (!identity) {
      identity = jwt.verify(token, process.env.JWT_SECRET);
    }

    const userId = identity.id || identity['https://shopsphere/user_id'];
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Token does not contain a user id.' });
    }

    const authService = process.env.AUTH_SERVICE_URL || 'http://localhost:5002';
    const result = await getJson(authService, `/internal/users/${encodeURIComponent(userId)}`);

    if (!result.ok || !result.data?.data) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    const user = result.data.data;
    if (user.status === 'DISABLED') {
      return res.status(403).json({ success: false, message: 'Account disabled.' });
    }

    req.user = user;
    req.auth = { ...identity, id: String(userId) };
    next();
  } catch (error) {
    console.error('AUTH ERROR:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission for this resource.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
