"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_1 = require("../generated/prisma");
var globalForPrisma = global;
var prisma = globalForPrisma.prisma || new prisma_1.PrismaClient();
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = prisma;
exports.default = prisma;
