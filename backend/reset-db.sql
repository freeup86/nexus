-- Use this to reset the migration history if needed
-- Run this in your PostgreSQL database

-- First, check what's in the migration table
SELECT * FROM _prisma_migrations;

-- If you want to mark the old migration as resolved:
UPDATE _prisma_migrations 
SET finished_at = NOW(), 
    migration_name = '20240526_fix_tweet_unique',
    applied_steps_count = 0
WHERE migration_name = '20240526_fix_tweet_unique';

-- Or if you want to completely remove it:
-- DELETE FROM _prisma_migrations WHERE migration_name = '20240526_fix_tweet_unique';