# Nexus Deployment Guide for Render.com

This guide will help you deploy the Nexus application to Render.com.

## Prerequisites

1. A [Render.com](https://render.com) account
2. A GitHub account (Render deploys from GitHub repositories)
3. A production database (PostgreSQL recommended for Render)

## Step 1: Prepare Your Repository

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Render deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/nexus.git
   git push -u origin main
   ```

2. **Ensure `.gitignore` includes**:
   - `node_modules/`
   - `.env`
   - `dist/`
   - `build/`

## Step 2: Set Up Database

Since your current database is Azure SQL Server with IP restrictions, you have two options:

### Option A: Use Render's PostgreSQL (Recommended)
1. Create a PostgreSQL database on Render
2. Update your Prisma schema to use PostgreSQL provider
3. Update DATABASE_URL to use the PostgreSQL connection string

### Option B: Configure Azure SQL Server
1. Add Render's IP addresses to Azure firewall rules
2. Use your existing Azure SQL Server connection string

## Step 3: Deploy to Render

1. **Log in to Render.com**

2. **Create a New Web Service** for the backend:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: `nexus-backend`
     - Environment: `Node`
     - Build Command: `cd backend && npm install && npm run build`
     - Start Command: `cd backend && npm start`
     - Set environment variables (see below)

3. **Create a Static Site** for the frontend:
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Configure:
     - Name: `nexus-frontend`
     - Build Command: `cd frontend && npm install && npm run build`
     - Publish Directory: `frontend/dist`

## Step 4: Configure Environment Variables

In the backend service settings, add these environment variables:

```
DATABASE_URL=your-production-database-url
JWT_SECRET=generate-a-secure-random-string
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
API2CONVERT_KEY=your-api2convert-key
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
TWITTER_ACCESS_TOKEN=your-twitter-access-token
TWITTER_ACCESS_TOKEN_SECRET=your-twitter-access-token-secret
CLIENT_ID=your-twitter-client-id
CLIENT_SECRET=your-twitter-client-secret
BEARER_TOKEN=your-twitter-bearer-token
FRONTEND_URL=https://nexus-frontend.onrender.com
NODE_ENV=production
PORT=10000
```

## Step 5: Update Frontend Configuration

1. Update the frontend to use the backend URL:
   - The `.env.production` file already contains the correct URL
   - Render will automatically use this during build

## Step 6: Deploy

1. **Commit and push** your changes:
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push
   ```

2. **Trigger deployment**:
   - Render will automatically deploy when you push to GitHub
   - Monitor the deployment logs in Render dashboard

## Step 7: Verify Deployment

1. **Test the backend**: 
   - Visit `https://nexus-backend.onrender.com/health`
   - Should return `{"status":"OK","timestamp":"..."}`

2. **Test the frontend**:
   - Visit `https://nexus-frontend.onrender.com`
   - Should load the Nexus application

## Troubleshooting

### Database Connection Issues
- If using Azure SQL Server, ensure Render's IPs are whitelisted
- Consider switching to PostgreSQL for easier deployment

### Build Failures
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify TypeScript compilation succeeds locally

### Runtime Errors
- Check service logs in Render dashboard
- Verify all environment variables are set correctly
- Ensure Prisma client is generated during build

## Alternative: Using render.yaml

Instead of manual setup, you can use the `render.yaml` file:

1. In Render dashboard, click "New +" → "Blueprint"
2. Connect your GitHub repository
3. Render will automatically detect `render.yaml` and set up services

## Notes

- Free tier services sleep after 15 minutes of inactivity
- First request after sleep will be slow (cold start)
- For production use, consider upgrading to paid tier
- Static assets are served from CDN automatically