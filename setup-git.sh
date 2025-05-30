#!/bin/bash

echo "🔧 Setting up Git for Nexus deployment..."

# Check current branch
current_branch=$(git branch --show-current 2>/dev/null)

if [ -z "$current_branch" ]; then
    echo "📝 No commits yet. Creating initial commit..."
    git add .
    git commit -m "Initial commit: Nexus application"
    current_branch=$(git branch --show-current)
fi

echo "📍 Current branch: $current_branch"

# If not on main, create/switch to main
if [ "$current_branch" != "main" ]; then
    echo "🔄 Switching to main branch..."
    git branch -M main
fi

# Check if remote exists
if git remote | grep -q "origin"; then
    echo "✅ Remote 'origin' already exists"
    git remote -v
else
    echo "❌ No remote 'origin' found"
    echo "📝 Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/nexus.git"
    exit 1
fi

echo ""
echo "✅ Git is set up!"
echo ""
echo "📤 Now you can push with:"
echo "   git push -u origin main"