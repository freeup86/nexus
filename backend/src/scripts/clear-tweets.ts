import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function clearTweets() {
  try {
    // Delete all tweets
    const result = await prisma.tweet.deleteMany({});
    console.log(`Deleted ${result.count} tweets`);
  } catch (error) {
    console.error('Error clearing tweets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTweets();