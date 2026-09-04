// src/utils/authUtils.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function getDerivedEncryptionKey(secret) {
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is missing in backend .env");
  }
  return new Promise((resolve, reject) => {
    crypto.hkdf(
      'sha256',
      secret,
      '',
      'NextAuth.js Generated Encryption Key',
      32,
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(new Uint8Array(derivedKey));
      }
    );
  });
}

module.exports = { signToken, getDerivedEncryptionKey };
