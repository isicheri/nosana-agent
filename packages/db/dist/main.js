import { PrismaClient } from '@prisma/client';
import dotenv from "dotenv";
// 1. Singleton Pattern: Prevents multiple client instances in development (hot-reloads)
// This is critical for performance and connection management.
dotenv.config({ path: "*" });
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
export const db = prisma;
export * from '@prisma/client';
//# sourceMappingURL=main.js.map