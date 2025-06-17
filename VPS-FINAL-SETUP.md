# VPS Final Setup - MongoDB Trial Users

## Current Configuration

### Development Environment
- Uses PostgreSQL for main database
- Uses memory storage for trial users (temporary)
- File fallback for trial settings

### VPS Production Environment
- **Trial users**: Always saved in MongoDB (production mode)
- **Trial settings**: File fallback with MongoDB primary
- MongoDB automatically forced when NODE_ENV=production

### VPS Commands

```bash
# Set MongoDB URL in .env file
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/jellyfin_signup

# Ensure production mode (automatically forces MongoDB)
NODE_ENV=production

# Or explicitly force MongoDB
FORCE_MONGODB=true

# Restart containers
docker-compose restart

# Verify MongoDB usage in logs
docker-compose logs | grep "Using storage: MongoDB"
```

## What This Achieves

1. **Trial users**: MongoDB storage in production (as requested)
2. **Trial settings**: File fallback ensures reliability
3. **Development**: Works with PostgreSQL/memory storage
4. **VPS deployment**: Automatic MongoDB detection and usage

Trial users will be properly stored in MongoDB on VPS deployment.