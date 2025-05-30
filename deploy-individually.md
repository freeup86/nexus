# Deploy Services Individually to Render

Since the Blueprint deployment is stuck, deploy each service manually:

## 1. Backend Service

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: nexus-backend
   - **Root Directory**: backend
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. Add Environment Variables:
   ```
   NODE_ENV=production
   DATABASE_URL=your-database-url
   JWT_SECRET=your-secret-key
   ANTHROPIC_API_KEY=your-anthropic-key
   OPENAI_API_KEY=your-openai-key
   FRONTEND_URL=https://your-frontend-url.onrender.com
   PORT=10000
   ```

## 2. Frontend Service

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: nexus-frontend
   - **Root Directory**: frontend
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: dist

4. Add Environment Variables:
   ```
   VITE_API_URL=https://nexus-backend.onrender.com/api
   ```

## 3. After Deployment

1. Update your frontend's `.env.production` with the actual backend URL
2. Commit and push to trigger a rebuild
3. Test your application

## Troubleshooting

If a deployment gets stuck:
1. Cancel it immediately
2. Check the logs for any errors
3. Deploy services one at a time
4. Ensure all environment variables are set before deploying