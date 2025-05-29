import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function checkTweets() {
  try {
    const tweets = await prisma.tweet.findMany({
      select: {
        id: true,
        twitterId: true,
        content: true,
        createdAt: true,
        status: true
      }
    });
    
    console.log('Total tweets in database:', tweets.length);
    console.log('\nTweet details:');
    tweets.forEach((tweet: any) => {
      console.log(`- ID: ${tweet.id}`);
      console.log(`  TwitterID: ${tweet.twitterId || 'null'}`);
      console.log(`  Status: ${tweet.status}`);
      console.log(`  Created: ${tweet.createdAt}`);
      console.log(`  Content: ${tweet.content.substring(0, 50)}...`);
      console.log('');
    });
    
    // Check for null twitterIds
    const nullTwitterIds = tweets.filter((t: any) => !t.twitterId);
    console.log(`Tweets with null twitterId: ${nullTwitterIds.length}`);
  } catch (error) {
    console.error('Error checking tweets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTweets();