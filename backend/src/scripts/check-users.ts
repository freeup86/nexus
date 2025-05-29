import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true
      }
    });
    
    console.log('Total users:', users.length);
    users.forEach((user: any) => {
      console.log(`- Username: ${user.username}, Email: ${user.email}, ID: ${user.id}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();