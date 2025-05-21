# Deploying Your Jellyfin Signup App

## Option 1: Netlify Deployment (Recommended)

1. Sign up for a free Netlify account at https://app.netlify.com/signup
2. Click "Add new site" → "Import an existing project"
3. Connect to your GitHub repository
4. Configure deployment settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Set environment variables in Netlify dashboard:
   - JELLYFIN_API_KEY
   - JELLYFIN_SERVER_URL
   - TMDB_API_KEY
6. Click "Deploy site"

## Option 2: Digital Ocean App Platform

1. Sign up for Digital Ocean
2. Create new App → Connect your GitHub repo
3. Set environment variables
4. Deploy with auto-deploy on

## Option 3: Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Init project: `firebase init hosting`
4. Deploy: `firebase deploy`

## Option 4: GitHub Pages

1. Add homepage to package.json: `"homepage": "https://yourusername.github.io/jellyfin-signup"`
2. Install gh-pages: `npm install gh-pages --save-dev`
3. Add scripts:
   ```
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
4. Run: `npm run deploy`

## Need help?

Contact me for personalized assistance with your deployment.