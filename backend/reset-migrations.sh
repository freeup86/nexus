#!/bin/bash

echo "Resetting migrations for PostgreSQL..."

# Backup current migrations
mv prisma/migrations prisma/migrations_backup_$(date +%Y%m%d_%H%M%S)

# Create fresh migrations directory
mkdir -p prisma/migrations

# Copy only the PostgreSQL migration
cp -r prisma/migrations_backup_*/20250530_init_postgresql prisma/migrations/

echo "Migrations reset. Only PostgreSQL migration remains."
echo "Old migrations backed up to prisma/migrations_backup_*"