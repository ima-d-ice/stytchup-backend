// src/prisma.js
// Generated client is plain JS (generator "prisma-client-js"), so plain require works.
const { PrismaClient } = require("./generated/prisma/client");
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
