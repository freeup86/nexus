-- Drop any unique constraints on Tweet table except for id and twitterId
DECLARE @sql NVARCHAR(MAX) = '';

SELECT @sql = @sql + 'ALTER TABLE [dbo].[Tweet] DROP CONSTRAINT [' + CONSTRAINT_NAME + ']; '
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_NAME = 'Tweet' 
  AND CONSTRAINT_TYPE = 'UNIQUE' 
  AND CONSTRAINT_NAME NOT IN ('Tweet_pkey', 'Tweet_twitterId_key');

EXEC sp_executesql @sql;