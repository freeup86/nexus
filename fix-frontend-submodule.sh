#!/bin/bash

echo "Fixing frontend submodule issue..."

# Check if frontend has a .git directory
if [ -d "frontend/.git" ]; then
    echo "Frontend has its own .git directory - removing it"
    rm -rf frontend/.git
fi

# Remove frontend from git's index
echo "Removing frontend from git index..."
git rm --cached frontend 2>/dev/null || true

# Check for .gitmodules
if [ -f ".gitmodules" ]; then
    echo "Found .gitmodules file"
    cat .gitmodules
    # Remove frontend submodule entry if it exists
    git config --file=.gitmodules --remove-section submodule.frontend 2>/dev/null || true
    git add .gitmodules
fi

# Now add frontend as regular directory
echo "Adding frontend as regular directory..."
git add frontend/

# Check status
echo "Current git status:"
git status --short | head -20

echo "Done! Now you can commit and push."