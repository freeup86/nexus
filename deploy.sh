#!/bin/bash

# Deploy script for Nexus app

echo "🚀 Deploying Nexus app..."

# Add all changes
git add -A

# Commit with message
git commit -m "Fix Updates"

# Push to GitHub
git push origin main

echo "✅ Code pushed to GitHub. Render will automatically deploy the changes."
echo "🔗 Backend: https://nexus-backend-1bjk.onrender.com"
echo "🔗 Frontend: https://nexus-frontend-uy54.onrender.com"