"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeRole = exports.googleSync = exports.login = exports.register = void 0;
const prisma_1 = require("../../prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const authUtils_1 = require("../utils/authUtils");
const client_1 = require("../../generated/prisma/client"); // 👈 IMPORT THIS
const register = async (req, res) => {
    let { name, email, password, role } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'email & password required' });
    email = email.toLowerCase().trim();
    try {
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing)
            return res.status(400).json({ error: 'User exists' });
        const hashed = await bcrypt_1.default.hash(password, 10);
        // Determine Role (Frontend sends "designer", we convert to Enum)
        const userRole = client_1.Role.CUSTOMER;
        const user = await prisma_1.prisma.user.create({
            data: {
                name,
                email,
                password: hashed,
                role: userRole // 👈 Passing the Enum value
            }
        });
        const token = (0, authUtils_1.signToken)(user);
        // ... cookie logic ...
        res.json({ user: { id: user.id, email: user.email, role: user.role }, token });
    }
    catch (err) {
        // 👇 This will print the REAL error to your terminal
        console.error("❌ Register Error:", err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    let { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'email & password required' });
    email = email.toLowerCase().trim();
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(401).json({ error: 'Invalid credentials' });
        const ok = await bcrypt_1.default.compare(password, user.password);
        if (!ok)
            return res.status(401).json({ error: 'Invalid credentials' });
        const token = (0, authUtils_1.signToken)(user);
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.login = login;
const googleSync = async (req, res) => {
    const { email, name } = req.body;
    if (!email)
        return res.status(400).json({ error: "Email required" });
    try {
        // 1. Try to find the user
        let user = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        // 2. If user doesn't exist, create them automatically
        if (!user) {
            // Generate a random generic password since they use Google to login
            const randomPassword = crypto_1.default.randomBytes(16).toString('hex');
            const hashedPassword = await bcrypt_1.default.hash(randomPassword, 10);
            user = await prisma_1.prisma.user.create({
                data: {
                    email,
                    name: name || "Google User",
                    password: hashedPassword,
                    role: client_1.Role.CUSTOMER, // Default role
                },
            });
        }
        // 3. Generate a Backend Token (Optional, but good for consistency)
        const token = (0, authUtils_1.signToken)(user);
        // 4. Return the REAL Database ID to NextAuth
        res.json({
            user: {
                id: user.id, // 👈 This is the Postgres CUID (e.g. cm3...)
                email: user.email,
                role: user.role,
                name: user.name
            },
            token
        });
    }
    catch (err) {
        console.error("Google Sync Error:", err);
        res.status(500).json({ error: "Server error during sync" });
    }
};
exports.googleSync = googleSync;
const changeRole = async (req, res) => {
    try {
        // 1. Log the User ID from Middleware
        console.log("👉 1. Request User ID:", req.user);
        if (!req.user) {
            console.log("❌ User ID missing from request");
            return res.status(401).json({ error: "User not authenticated" });
        }
        // 2. Log the Incoming Body
        const { role } = req.body;
        console.log("👉 2. Requested Role Change:", role);
        // 3. Validate Role Conversion
        let newRole;
        if (role === 'designer')
            newRole = client_1.Role.DESIGNER;
        else if (role === 'customer')
            newRole = client_1.Role.CUSTOMER;
        else {
            console.log("❌ Invalid Role String:", role);
            return res.status(400).json({ error: "Invalid role specified" });
        }
        console.log("👉 3. Converted to Enum:", newRole);
        // 4. Attempt DB Update
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: req.user },
            data: { role: newRole }
        });
        console.log("✅ 4. Update Success:", updatedUser.role);
        res.json(updatedUser);
    }
    catch (err) {
        // 👇 THIS IS THE MOST IMPORTANT LOG
        console.error("🔥 CRITICAL ERROR in changeRole:", err);
        res.status(500).json({ error: "Server error", details: err.message });
    }
};
exports.changeRole = changeRole;
