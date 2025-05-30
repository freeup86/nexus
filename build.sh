#!/bin/bash
set -e

echo "=== Nexus Frontend Build Script ==="
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

echo "=== Checking directory structure ==="
if [ -d "frontend" ]; then
    echo "✓ Frontend directory exists"
else
    echo "✗ Frontend directory not found!"
    exit 1
fi

echo "=== Looking for frontend directory ==="
# Check if we're in a src subdirectory
if [ -d "../frontend" ] && [ -f "../frontend/package.json" ]; then
    echo "✓ Found frontend in parent directory"
    cd ..
elif [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    echo "✓ Found frontend in current directory"
else
    echo "✗ Frontend directory not found!"
    echo "Current directory contents:"
    ls -la
    echo "Parent directory contents:"
    ls -la ..
    exit 1
fi

echo "=== Checking frontend package.json ==="
echo "Available scripts in frontend:"
cd frontend && npm run && cd ..

echo "=== Installing frontend dependencies ==="
cd frontend
npm install --verbose

echo "=== Building frontend ==="
npm run build

echo "=== Build complete! ==="
echo "Build output location: frontend/build"
ls -la build/ || echo "Build directory not found"