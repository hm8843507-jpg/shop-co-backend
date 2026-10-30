const port = Number(process.env.PORT || 5000);
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid port number.');
}

if (!mongoUri) {
  throw new Error('MONGO_URI is required. Copy .env.example to .env and configure it.');
}

if (!jwtSecret || jwtSecret.length < 32 || jwtSecret === 'replace-this-with-a-long-random-secret') {
  throw new Error('JWT_SECRET must be a unique secret with at least 32 characters.');
}

if (Boolean(process.env.ADMIN_EMAIL) !== Boolean(process.env.ADMIN_PASSWORD)) {
  throw new Error('Set both ADMIN_EMAIL and ADMIN_PASSWORD to create an initial administrator.');
}

module.exports = {
  port,
  mongoUri,
  jwtSecret,
  jwtExpiresIn,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
};
