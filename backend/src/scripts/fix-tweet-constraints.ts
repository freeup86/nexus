import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function fixTweetConstraints() {
  try {
    // First, let's see all constraints
    const constraints = await prisma.$queryRaw`
      SELECT 
        tc.CONSTRAINT_NAME,
        tc.CONSTRAINT_TYPE,
        kcu.COLUMN_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
      JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
        ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
      WHERE tc.TABLE_NAME = 'Tweet'
      ORDER BY tc.CONSTRAINT_NAME, kcu.ORDINAL_POSITION
    `;
    
    console.log('All constraints on Tweet table:');
    console.log(constraints);

    // Check for any unique indexes
    const uniqueIndexes = await prisma.$queryRaw`
      SELECT 
        i.name AS index_name,
        COL_NAME(ic.object_id, ic.column_id) AS column_name,
        i.is_unique,
        i.is_unique_constraint
      FROM sys.indexes i
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN sys.tables t ON i.object_id = t.object_id
      WHERE t.name = 'Tweet' AND i.is_unique = 1
      ORDER BY i.name, ic.key_ordinal
    `;
    
    console.log('\nUnique indexes on Tweet table:');
    console.log(uniqueIndexes);

    // Drop the problematic constraint if it exists
    try {
      // First check if there's a unique constraint we don't know about
      const unknownConstraints = await prisma.$queryRaw`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_NAME = 'Tweet' 
          AND CONSTRAINT_TYPE = 'UNIQUE' 
          AND CONSTRAINT_NAME NOT IN ('Tweet_pkey', 'Tweet_twitterId_key')
      `;
      
      if (Array.isArray(unknownConstraints) && unknownConstraints.length > 0) {
        for (const constraint of unknownConstraints) {
          console.log(`\nDropping constraint: ${constraint.CONSTRAINT_NAME}`);
          await prisma.$executeRaw`ALTER TABLE [dbo].[Tweet] DROP CONSTRAINT ${constraint.CONSTRAINT_NAME}`;
        }
      }
    } catch (error) {
      console.log('No unknown constraints to drop or error dropping:', error);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTweetConstraints();