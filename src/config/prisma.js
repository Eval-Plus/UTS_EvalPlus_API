import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Cierre
process.on('beforeEXit', async () => {
  await prisma.$disconect();
});

export default prisma;
