"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// src/prisma.ts
const client_1 = require("./generated/prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL || "",
});
exports.prisma = global.__prisma ??
    new client_1.PrismaClient({
        adapter,
        log: ["query"],
    });
if (process.env.NODE_ENV !== "production")
    global.__prisma = exports.prisma;
