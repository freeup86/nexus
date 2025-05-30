#!/bin/bash

echo "Fixing migrations for PostgreSQL deployment..."

# Remove the old SQL Server migration
echo "Removing old SQL Server migration..."
rm -rf prisma/migrations/20240526_fix_tweet_unique

# List remaining migrations
echo "Remaining migrations:"
ls -la prisma/migrations/

echo "Done! Now commit and push."