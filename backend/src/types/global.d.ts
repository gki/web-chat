import { PrismaClient } from '@prisma/client';

declare global {
  var testDb: PrismaClient;
}

export {};