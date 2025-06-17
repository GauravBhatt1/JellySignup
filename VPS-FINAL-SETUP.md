# VPS Final Setup - MongoDB Trial Users

## Current Configuration

### Trial Users
- **Always saved in MongoDB** (VPS production environment)
- No file fallback - ensures data integrity
- Proper error handling if MongoDB fails

### Trial Settings  
- **Primary**: MongoDB storage
- **Fallback**: File-based storage (trial-settings.json)
- Hybrid approach for reliability

### VPS Commands

```bash
# Ensure MongoDB is forced in production
echo "NODE_ENV=production" >> .env
echo "FORCE_MONGODB=true" >> .env

# Update DATABASE_URL to MongoDB format
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/jellyfin_signup

# Restart containers
docker-compose restart

# Verify MongoDB usage
curl http://localhost:5000/health
docker-compose logs | grep "Using storage: MongoDB"
```

## What This Achieves

1. **Trial users**: Always in MongoDB (as requested)
2. **Trial settings**: Reliable with file fallback
3. **VPS compatibility**: Works regardless of connection issues
4. **Data integrity**: No mock data, authentic storage only

Trial user data will be properly stored in MongoDB on VPS while maintaining system reliability.