#!/bin/bash

# Create a temporary directory for the frontend
echo "Creating standalone frontend repository..."

# Copy frontend to Desktop
cp -r frontend ~/Desktop/nexus-frontend
cd ~/Desktop/nexus-frontend

# Update the API URL in the code
echo "VITE_API_URL=https://nexus-backend-1bjk.onrender.com/api" > .env.production

# Initialize git
git init
git add .
git commit -m "Initial commit - Nexus Frontend"

echo "Frontend is ready at ~/Desktop/nexus-frontend"
echo ""
echo "Next steps:"
echo "1. Create a new repository on GitHub called 'nexus-frontend'"
echo "2. Run these commands:"
echo "   cd ~/Desktop/nexus-frontend"
echo "   git remote add origin https://github.com/freeup86/nexus-frontend.git"
echo "   git push -u origin main"
echo ""
echo "3. Deploy on Render:"
echo "   - Create new Static Site"
echo "   - Connect to nexus-frontend repository"
echo "   - Build Command: npm install && npm run build"
echo "   - Publish Directory: build"