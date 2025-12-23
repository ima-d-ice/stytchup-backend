// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { jwtDecrypt } from 'jose';
import { getDerivedEncryptionKey } from '../utils/authUtils';

// Extend Express Request to include 'user'
export interface AuthRequest extends Request {
  user?: string; // This will hold the userId
}

export const isAuthenticated = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies['next-auth.session-token'] || req.cookies['__Secure-next-auth.session-token'];

    if (!token) {
      return res.status(401).json({ error: "Not authenticated (No Cookie)" });
    }

    const encryptionSecret = await getDerivedEncryptionKey(process.env.NEXTAUTH_SECRET);

    const { payload } = await jwtDecrypt(token, encryptionSecret, {
      clockTolerance: 15,
    });

    if (!payload.sub) {
      return res.status(401).json({ error: "Invalid Token" });
    }

    // Attach user ID to the request object
    req.user = payload.sub;
    
    next(); // Pass control to the controller
  } catch (err) {
    console.error("Middleware Auth Error:", err);
    res.status(401).json({ error: "Authentication failed" });
  }
};

