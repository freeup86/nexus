#!/bin/bash

echo "Creating initial migration for PostgreSQL..."

# Set a temporary DATABASE_URL for creating migration
export DATABASE_URL="postgresql://temp:temp@localhost:5432/temp?schema=public"

# Create migration without applying it
npx prisma migrate dev --name init --create-only

echo "Migration created successfully!"
echo "The migration file is in prisma/migrations/"
echo "It will be applied automatically when you deploy."