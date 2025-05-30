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

echo "=== Checking frontend package.json ==="
if [ -f "frontend/package.json" ]; then
    echo "✓ frontend/package.json exists"
    echo "Available scripts in frontend:"
    cd frontend && npm run && cd ..
else
    echo "✗ frontend/package.json not found!"
    exit 1
fi

echo "=== Installing frontend dependencies ==="
cd frontend
npm install --verbose

echo "=== Building frontend ==="
npm run build

echo "=== Build complete! ==="
echo "Build output location: frontend/build"
ls -la build/ || echo "Build directory not found"