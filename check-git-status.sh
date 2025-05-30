#!/bin/bash

echo "Checking git status..."
git status

echo -e "\n\nChecking if frontend files are tracked:"
git ls-files | grep "^frontend/" | wc -l

echo -e "\n\nChecking untracked files:"
git status --porcelain | grep "^??" | grep "frontend/"

echo -e "\n\nChecking .gitignore for frontend:"
grep -n "frontend" .gitignore || echo "No 'frontend' in .gitignore"

echo -e "\n\nAdding frontend files to git:"
git add frontend/
git status --short | grep "^A" | head -20