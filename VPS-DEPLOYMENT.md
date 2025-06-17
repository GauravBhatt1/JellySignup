# VPS Deployment - Quick Fix Guide

## Issue Identified
Container builds successfully but exits immediately due to missing production dependencies.

## Fixed Configuration

### 1. Simple Dockerfile (Working)
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 5000
ENV NODE_ENV=production
CMD ["npm", "start"]
```

### 2. Environment Setup
Create `.env` file:
```env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/jellyfin_signup
JELLYFIN_SERVER_URL=http://192.168.1.100:8096
JELLYFIN_API_KEY=your_jellyfin_api_key
TMDB_API_KEY=your_tmdb_api_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
SESSION_SECRET=random_secret_key_here
```

### 3. Deploy Commands
```bash
# Pull latest code
git pull

# Stop existing containers
docker-compose down

# Build and start
docker-compose build --no-cache
docker-compose up -d

# Check status
docker-compose logs -f
```

### 4. Alternative Method
If docker-compose still fails, use production compose:
```bash
docker-compose -f docker-compose.production.yml up -d
```

Or use the deployment script:
```bash
./deploy.sh
```

## Troubleshooting
- If container exits immediately: Check environment variables
- If build fails: Run `docker system prune -f` first
- If MongoDB connection fails: Verify DATABASE_URL format

## Access Points
- App: http://your-vps-ip:5000
- Admin: http://your-vps-ip:5000/admin
- Health: http://your-vps-ip:5000/health