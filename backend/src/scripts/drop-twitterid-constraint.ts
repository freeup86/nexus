import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function dropTwitterIdConstraint() {
  try {
    // Drop the unique constraint on twitterId
    await prisma.$executeRaw`
      IF EXISTS (
        SELECT * FROM sys.indexes 
        WHERE name = 'Tweet_twitterId_key' 
        AND object_id = OBJECT_ID('dbo.Tweet')
      )
      BEGIN
        ALTER TABLE dbo.Tweet DROP CONSTRAINT Tweet_twitterId_key;
      END
    `;
    
    console.log('Successfully dropped twitterId unique constraint');
    
    // Regenerate Prisma client
    console.log('Remember to run: npx prisma generate');
  } catch (error) {
    console.error('Error dropping constraint:', error);
  } finally {
    await prisma.$disconnect();
  }
}

dropTwitterIdConstraint();