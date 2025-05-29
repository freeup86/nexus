#!/bin/bash

echo "Fixing authentication issues..."

# Generate Prisma client
echo "Generating Prisma client..."
cd /Users/cortez/Documents/Projects/nexus/backend
npx prisma generate

# Create uploads directory
echo "Creating upload directories..."
mkdir -p uploads/documents

echo "Done! Please restart your backend server."