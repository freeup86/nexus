#!/bin/bash

echo "Testing Nexus Backend API..."
echo ""

# Test health endpoint
echo "1. Testing Health Endpoint:"
curl -X GET https://nexus-backend-1bjk.onrender.com/health
echo ""
echo ""

# Test login endpoint
echo "2. Testing Login Endpoint:"
curl -X POST https://nexus-backend-1bjk.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
echo ""
echo ""

# You can add more tests here
echo "3. Testing if server accepts requests:"
curl -I https://nexus-backend-1bjk.onrender.com/health