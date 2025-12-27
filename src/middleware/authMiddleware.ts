// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { jwtDecrypt } from 'jose';
import jwt from 'jsonwebtoken';
import { getDerivedEncryptionKey } from '../utils/authUtils';

// Extend Express Request to include 'user'
export interface AuthRequest extends Request {
  user?: string; // This will hold the userId
}

export const isAuthenticated = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Try to get token from Authorization header
    let token = req.headers.authorization?.split(' ')[1];

    // 2. If not in header, try 'token' cookie (Backend Login)
    if (!token) {
      token = req.cookies['token'];
    }

    // 3. If not in 'token' cookie, try NextAuth cookies
    if (!token) {
      token = req.cookies['next-auth.session-token'] || req.cookies['__Secure-next-auth.session-token'];
    }

    if (!token) {
      return res.status(401).json({ error: "Not authenticated (No Token)" });
    }

    // 4. Try to verify as standard JWT (Backend Login)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret') as any;
      if (decoded.id) {
        req.user = decoded.id;
        return next();
      }
    } catch (jwtError) {
      // If JWT verification fails, it might be a NextAuth JWE. Continue...
    }

    // 5. Try to decrypt as NextAuth JWE
    try {
      const encryptionSecret = await getDerivedEncryptionKey(process.env.NEXTAUTH_SECRET);
      const { payload } = await jwtDecrypt(token, encryptionSecret, {
        clockTolerance: 15,
      });

      if (payload.sub) {
        req.user = payload.sub;
        return next();
      }
    } catch (jweError) {
       // Both failed
    }

    return res.status(401).json({ error: "Invalid Token" });
    
  } catch (err) {
    console.error("Middleware Auth Error:", err);
    res.status(401).json({ error: "Authentication failed" });
  }
};

