// src/middleware/authMiddleware.js
const { jwtDecrypt } = require('jose');
const jwt = require('jsonwebtoken');
const { getDerivedEncryptionKey } = require('../utils/authUtils');

async function loadRole(userId) {
  try {
    const { prisma } = require('../../prisma');
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    return u?.role || 'CUSTOMER';
  } catch {
    return 'CUSTOMER';
  }
}

const isAuthenticated = async (req, res, next) => {
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret');
      if (decoded.id) {
        req.user = decoded.id;
        req.role = decoded.role || (await loadRole(decoded.id));
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
        req.role = await loadRole(payload.sub);
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

module.exports = { isAuthenticated };
