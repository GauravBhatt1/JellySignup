# VPS Deployment Troubleshooting Guide

## Common VPS Issues and Solutions

### Issue 1: Container Exits Immediately
**Symptoms:** Docker build succeeds but container stops right after starting

**Solution:**
```bash
# Check container logs for exact error
docker-compose logs jellyfin-signup

# Common fixes:
# 1. Missing environment variables
# 2. MongoDB connection failure
# 3. Port conflicts
```

### Issue 2: MongoDB Connection Failed
**Symptoms:** "MongoDB connection error" in logs

**Solution:**
1. Verify DATABASE_URL format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database_name
   ```
2. Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)
3. Verify username/password are correct

### Issue 3: Jellyfin API Errors
**Symptoms:** "Jellyfin API key invalid" or connection timeout

**Solution:**
1. Test Jellyfin API manually:
   ```bash
   curl -H "X-Emby-Token: YOUR_API_KEY" "http://your-jellyfin:8096/jellyfin/Users"
   ```
2. Ensure JELLYFIN_SERVER_URL is accessible from VPS
3. Check firewall rules

### Issue 4: Build Failures
**Symptoms:** Docker build fails during npm install or build step

**Solution:**
```bash
# Clear Docker cache completely
docker system prune -a -f

# Use the simple Dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 5000
ENV NODE_ENV=production
CMD ["npm", "start"]
```

### Issue 5: Port Already in Use
**Symptoms:** "EADDRINUSE: address already in use"

**Solution:**
```bash
# Find and kill process using port
sudo lsof -ti:5000 | xargs sudo kill -9

# Or change port in docker-compose.yml
ports:
  - "5001:5000"  # Use different external port
```

## VPS-Specific Commands

### Complete Fresh Deployment
```bash
# 1. Clean everything
docker-compose down --remove-orphans
docker system prune -a -f

# 2. Deploy fresh
./vps-deploy-complete.sh
```

### Quick Restart
```bash
docker-compose restart jellyfin-signup
```

### Debug Mode
```bash
# Run container interactively for debugging
docker-compose run --rm jellyfin-signup /bin/bash
```

### Environment Variable Check
```bash
# Verify environment variables are loaded
docker-compose exec jellyfin-signup env | grep -E "(DATABASE_URL|JELLYFIN|TMDB)"
```

## Manual Verification Steps

1. **Test MongoDB Connection:**
   ```bash
   docker-compose exec jellyfin-signup node -e "
   const mongoose = require('mongoose');
   mongoose.connect(process.env.DATABASE_URL)
     .then(() => console.log('MongoDB OK'))
     .catch(err => console.error('MongoDB Error:', err));
   "
   ```

2. **Test Jellyfin API:**
   ```bash
   curl -H "X-Emby-Token: $JELLYFIN_API_KEY" "$JELLYFIN_SERVER_URL/jellyfin/Users"
   ```

3. **Test TMDB API:**
   ```bash
   curl "https://api.themoviedb.org/3/trending/movie/week?api_key=$TMDB_API_KEY"
   ```

## Success Indicators

✅ Container shows "Up" status in `docker-compose ps`
✅ Health endpoint responds: `curl http://localhost:5000/health`
✅ Application accessible on port 5000
✅ No error messages in logs
✅ Admin panel accessible

## Emergency Reset

If everything fails, use this nuclear option:
```bash
# Stop all containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm $(docker ps -aq)

# Remove all images
docker rmi $(docker images -q)

# Clean everything
docker system prune -a -f

# Fresh start
./vps-deploy-complete.sh
```