#!/bin/bash

# Kill any existing processes on port 5001
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

# Navigate to backend directory
cd /Users/cortez/Documents/Projects/nexus/backend

# Start the backend server
echo "Starting Nexus backend server..."
npm run dev