import { PrismaClient } from '../generated/prisma';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Handle connection errors gracefully
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    if (process.env.NODE_ENV === 'production') {
      // In production, exit if database is not available
      process.exit(1);
    }
  });

// Gracefully disconnect on app termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});