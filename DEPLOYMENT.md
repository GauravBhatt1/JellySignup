# Direct Deployment Instructions

## Quick Deployment Links

Click these links to deploy your application directly from GitHub:

### Vercel (Recommended)
[Deploy to Vercel](https://vercel.com/new/import?repository-url=https://github.com/GauravBhatt1/JellySignup)

### Netlify
[Deploy to Netlify](https://app.netlify.com/start/deploy?repository=https://github.com/GauravBhatt1/JellySignup)

### Railway
[Deploy to Railway](https://railway.app/new/template?template=https%3A%2F%2Fgithub.com%2FGauravBhatt1%2FJellySignup)

## Step-by-Step Instructions

### For Vercel:

1. Click the "Deploy to Vercel" link above
2. Connect with your GitHub account
3. Set the required environment variables:
   - JELLYFIN_API_KEY
   - JELLYFIN_SERVER_URL
   - TMDB_API_KEY
4. Click "Deploy"
5. Wait for deployment to complete
6. Access your new site at the provided Vercel URL

### Environment Variables

All deployment platforms require these environment variables:

- `JELLYFIN_API_KEY`: Your Jellyfin API key
- `JELLYFIN_SERVER_URL`: Your Jellyfin server URL (e.g., https://jellyfin.yourdomain.com)
- `TMDB_API_KEY`: Your TMDB API key for movie backgrounds