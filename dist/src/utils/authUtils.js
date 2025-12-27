"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.getDerivedEncryptionKey = getDerivedEncryptionKey;
// src/utils/authUtils.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret';
function signToken(user) {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}
async function getDerivedEncryptionKey(secret) {
    if (!secret) {
        throw new Error("NEXTAUTH_SECRET is missing in backend .env");
    }
    return new Promise((resolve, reject) => {
        crypto_1.default.hkdf('sha256', secret, '', 'NextAuth.js Generated Encryption Key', 32, (err, derivedKey) => {
            if (err)
                reject(err);
            else
                resolve(new Uint8Array(derivedKey));
        });
    });
}
