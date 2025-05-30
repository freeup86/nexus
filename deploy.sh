#!/bin/bash

# Deploy script for Nexus app

echo "🚀 Deploying Nexus app..."

# Add all changes
git add -A

# Commit with message
git commit -m "Fix Contract Analyzer field name mismatches

- Changed fileName to filename throughout contract routes
- Changed fileType to mimeType to match schema
- Removed references to separate contractAnalysis table
- Updated to store analysis data directly in contract table fields
- Fixed get single contract endpoint to use correct field names
- Analysis data now stored in contract fields: summary, keyTerms, risks, obligations, dates, parties

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
git push origin main

echo "✅ Code pushed to GitHub. Render will automatically deploy the changes."
echo "🔗 Backend: https://nexus-backend-1bjk.onrender.com"
echo "🔗 Frontend: https://nexus-frontend-uy54.onrender.com"