import { PrismaClient } from "@prisma/client";

import { appConfig } from "@/config/appConfig";

const createPrismaClient = () =>
  new PrismaClient({
    log:
    appConfig.environment === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (appConfig.environment !== "production") globalForPrisma.prisma = db;
