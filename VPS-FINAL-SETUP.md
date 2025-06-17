# VPS Final Setup - MongoDB Trial Users

## Current Configuration

### All Environments (Development & Production)
- **Database**: MongoDB for everything (forced everywhere)
- **Trial users**: Always saved in MongoDB 
- **Trial settings**: MongoDB primary with file fallback
- **Unified approach**: Same storage system everywhere

### VPS Commands

```bash
# Set MongoDB URL in .env file (REQUIRED)
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/jellyfin_signup

# Alternative: Local MongoDB
# DATABASE_URL=mongodb://localhost:27017/jellyfin_signup

# Restart containers
docker-compose restart

# Verify MongoDB usage in logs
docker-compose logs | grep "MongoDB connected successfully"
```

## What This Achieves

1. **Trial users**: MongoDB storage in production (as requested)
2. **Trial settings**: File fallback ensures reliability
3. **Development**: Works with PostgreSQL/memory storage
4. **VPS deployment**: Automatic MongoDB detection and usage

Trial users will be properly stored in MongoDB on VPS deployment.