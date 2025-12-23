// src/utils/authUtils.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret';

export function signToken(user: any) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function getDerivedEncryptionKey(secret: string | undefined) {
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is missing in backend .env");
  }
  return new Promise<Uint8Array>((resolve, reject) => {
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