// src/controllers/authController.ts
import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { signToken } from '../utils/authUtils';
import { Role } from '../../generated/prisma/client'; // 👈 IMPORT THIS
import { AuthRequest } from '../middleware/authMiddleware';

export const register = async (req: Request, res: Response) => {
  let { name, email, password, role } = req.body;
  
  if (!email || !password) return res.status(400).json({ error: 'email & password required' });
   
  email = email.toLowerCase().trim();

  try {
    const existing = await prisma.user.findUnique({ where: { email }});
    if (existing) return res.status(400).json({ error: 'User exists' });
    
    const hashed = await bcrypt.hash(password, 10);

    // Determine Role (Frontend sends "designer", we convert to Enum)
    const userRole =  Role.CUSTOMER;

    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashed, 
        role: userRole // 👈 Passing the Enum value
      } 
    });

    const token = signToken(user);

    // ... cookie logic ...
    
    res.json({ user: { id: user.id, email: user.email, role: user.role }, token });
  } catch (err: any) {
    // 👇 This will print the REAL error to your terminal
    console.error("❌ Register Error:", err); 
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
    let { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email & password required' });

  email = email.toLowerCase().trim();

  try {
    const user = await prisma.user.findUnique({ where: { email }});
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
export const googleSync = async (req: Request, res: Response) => {
  const { email, name } = req.body;

  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    // 1. Try to find the user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // 2. If user doesn't exist, create them automatically
    if (!user) {
      // Generate a random generic password since they use Google to login
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          name: name || "Google User",
          password: hashedPassword,
          role: Role.CUSTOMER, // Default role
        },
      });
    }

    // 3. Generate a Backend Token (Optional, but good for consistency)
    const token = signToken(user);

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

  } catch (err: any) {
    console.error("Google Sync Error:", err);
    res.status(500).json({ error: "Server error during sync" });
  }
};
export const changeRole = async (req: AuthRequest, res: Response) => {
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
    let newRole: Role;
    if (role === 'designer') newRole = Role.DESIGNER;
    else if (role === 'customer') newRole = Role.CUSTOMER;
    else {
      console.log("❌ Invalid Role String:", role);
      return res.status(400).json({ error: "Invalid role specified" });
    }

    console.log("👉 3. Converted to Enum:", newRole);

    // 4. Attempt DB Update
    const updatedUser = await prisma.user.update({
      where: { id: req.user }, 
      data: { role: newRole } 
    });

    console.log("✅ 4. Update Success:", updatedUser.role);
    res.json(updatedUser);

  } catch (err: any) {
    // 👇 THIS IS THE MOST IMPORTANT LOG
    console.error("🔥 CRITICAL ERROR in changeRole:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}