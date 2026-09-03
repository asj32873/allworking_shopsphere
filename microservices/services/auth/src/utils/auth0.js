const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

/*
 * Auth0 configuration
 */

const auth0Domain = (process.env.AUTH0_DOMAIN || "")
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

const auth0Audience = process.env.AUTH0_AUDIENCE;

if (!auth0Domain) {
  console.warn("[AUTH0] AUTH0_DOMAIN is not configured.");
}

if (!auth0Audience) {
  console.warn("[AUTH0] AUTH0_AUDIENCE is not configured.");
}

/*
 * Auth0 issuer
 */

const issuer = auth0Domain ? `https://${auth0Domain}/` : null;

/*
 * JWKS client
 */

const client = auth0Domain
  ? jwksClient({
      jwksUri: `${issuer}.well-known/jwks.json`,

      cache: true,

      cacheMaxEntries: 5,

      cacheMaxAge: 10 * 60 * 1000,

      rateLimit: true,

      jwksRequestsPerMinute: 10,
    })
  : null;

/*
 * Get Auth0 signing key.
 */

function getSigningKey(header, callback) {
  if (!client) {
    return callback(new Error("Auth0 is not configured."));
  }

  if (!header.kid) {
    return callback(
      new Error("Auth0 token does not contain a signing key identifier."),
    );
  }

  client
    .getSigningKey(header.kid)
    .then((key) => {
      callback(null, key.getPublicKey());
    })
    .catch(callback);
}

/*
 * Verify Auth0 Access Token.
 *
 * Expected:
 *
 * - RS256
 * - Correct issuer
 * - Correct audience
 * - Valid Auth0 JWKS signing key
 */

function verifyAuth0Token(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,

      getSigningKey,

      {
        algorithms: ["RS256"],

        audience: auth0Audience,

        issuer,
      },

      (error, payload) => {
        if (error) {
          return reject(error);
        }

        resolve(payload);
      },
    );
  });
}

/*
 * Get authenticated Auth0 user profile.
 *
 * The Access Token may NOT contain:
 *
 * - email
 * - name
 * - nickname
 *
 * Therefore we use /userinfo.
 */

async function getAuth0UserInfo(accessToken) {
  if (!issuer) {
    throw new Error("Auth0 issuer is not configured.");
  }

  const response = await fetch(`${issuer}userinfo`, {
    method: "GET",

    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.error("[AUTH0 USERINFO ERROR]", response.status, data || text);

    throw new Error("Unable to retrieve Auth0 user profile.");
  }

  if (!data) {
    throw new Error("Auth0 returned an empty user profile.");
  }

  return data;
}

module.exports = {
  verifyAuth0Token,

  getAuth0UserInfo,
};
