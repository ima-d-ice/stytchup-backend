"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
const jose_1 = require("jose");
const authUtils_1 = require("../utils/authUtils");
const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies['next-auth.session-token'] || req.cookies['__Secure-next-auth.session-token'];
        if (!token) {
            return res.status(401).json({ error: "Not authenticated (No Cookie)" });
        }
        const encryptionSecret = await (0, authUtils_1.getDerivedEncryptionKey)(process.env.NEXTAUTH_SECRET);
        const { payload } = await (0, jose_1.jwtDecrypt)(token, encryptionSecret, {
            clockTolerance: 15,
        });
        if (!payload.sub) {
            return res.status(401).json({ error: "Invalid Token" });
        }
        // Attach user ID to the request object
        req.user = payload.sub;
        next(); // Pass control to the controller
    }
    catch (err) {
        console.error("Middleware Auth Error:", err);
        res.status(401).json({ error: "Authentication failed" });
    }
};
exports.isAuthenticated = isAuthenticated;
