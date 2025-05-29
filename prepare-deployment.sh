#!/bin/bash

echo "🚀 Preparing Nexus for deployment to Render..."

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << EOL
# Dependencies
node_modules/
*/node_modules/

# Production
dist/
build/
*/dist/
*/build/

# Environment
.env
.env.local
.env.development
.env.production.local
*/.env
*/.env.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
*.swp
*.swo

# IDE
.vscode/
.idea/

# Testing
coverage/

# Temporary
tmp/
temp/
uploads/
EOL
fi

# Build backend to check for errors
echo "🔨 Building backend..."
cd backend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed. Please fix errors before deploying."
    exit 1
fi
cd ..

# Build frontend to check for errors
echo "🔨 Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed. Please fix errors before deploying."
    exit 1
fi
cd ..

echo "✅ Build successful!"
echo ""
echo "📋 Next steps:"
echo "1. Create a GitHub repository"
echo "2. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for Render deployment'"
echo "   git remote add origin https://github.com/YOUR_USERNAME/nexus.git"
echo "   git push -u origin main"
echo ""
echo "3. Go to render.com and:"
echo "   - Create a new Blueprint"
echo "   - Connect your GitHub repository"
echo "   - Render will detect render.yaml and set up services"
echo ""
echo "4. Configure environment variables in Render dashboard"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"