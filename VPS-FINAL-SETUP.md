# VPS Final Setup - MongoDB Trial Users

## Current Configuration

### VPS Production Environment
- **Database**: MongoDB Atlas (automatic detection)
- **Trial users**: Saved in MongoDB with 7-day expiry
- **Trial settings**: File fallback system active
- **User creation**: Automatic Jellyfin + MongoDB trial tracking
- **Verified working**: User signup, trial creation, MongoDB storage

### VPS Commands

```bash
# Set MongoDB URL in .env file (REQUIRED)
DATABASE_URL=mongodb+srv://gauravbhatt8160:9PgTpvopw3OJD9Ny@cluster0.yalif93.mongodb.net/jellyfin_signup?retryWrites=true&w=majority&appName=Cluster0

# Alternative: Local MongoDB
# DATABASE_URL=mongodb://localhost:27017/jellyfin_signup

# Restart containers
docker-compose restart

# Verify MongoDB usage in logs
docker-compose logs | grep "MongoDB connected successfully"

# Test trial user creation
curl -X POST http://your-domain.com/api/jellyfin/users \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "Password123"}'

# Check trial users in MongoDB
curl http://your-domain.com/api/debug/trial-users
```

## What This Achieves

1. **Trial users**: MongoDB storage in production (as requested)
2. **Trial settings**: File fallback ensures reliability
3. **Development**: Works with PostgreSQL/memory storage
4. **VPS deployment**: Automatic MongoDB detection and usage

Trial users will be properly stored in MongoDB on VPS deployment.