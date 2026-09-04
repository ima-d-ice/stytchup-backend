// src/prisma.js
// Note: generated client is TypeScript (.ts) — Node 22+ strips types natively,
// so require the explicit .ts path (extensionless resolve only tries .js/.json).
const { PrismaClient } = require("./generated/prisma/client.ts");
const { PrismaPg } = require("@prisma/adapter-pg");
const dotenv = require("dotenv");

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || "",
});

const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

module.exports = { prisma };
