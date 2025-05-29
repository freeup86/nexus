import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function checkUserTable() {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        c.name AS column_name,
        t.name AS data_type,
        c.max_length,
        c.precision,
        c.scale,
        c.is_nullable
      FROM sys.columns c
      INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
      WHERE c.object_id = OBJECT_ID('User')
      AND c.name = 'id'
    `;
    
    console.log('User.id column structure:', result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserTable();