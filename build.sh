#!/bin/bash
set -e

echo "Current directory: $(pwd)"
echo "Contents of current directory:"
ls -la

echo "Checking frontend directory:"
ls -la frontend/

echo "Installing frontend dependencies..."
cd frontend
npm install

echo "Building frontend..."
npm run build

echo "Build complete!"
echo "Contents of build directory:"
ls -la build/