# VPS MongoDB Fix Commands

## Quick Commands for VPS

```bash
# 1. Add FORCE_MONGODB flag to .env
echo "FORCE_MONGODB=true" >> .env

# 2. Update DATABASE_URL to MongoDB format (replace with your actual MongoDB URL)
# Edit .env file:
nano .env

# Add or update this line:
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/jellyfin_signup

# 3. Restart containers
docker-compose down && docker-compose up -d

# 4. Check if MongoDB is detected
curl http://localhost:5000/health

# 5. Check logs for storage configuration
docker-compose logs | grep "Storage Configuration"
```

## Verification Steps

After running the commands:

1. Health endpoint should show `"databaseType": "MongoDB"`
2. Logs should show `"Using storage: MongoDB"`
3. Trial settings should save without errors

## Manual Fix Alternative

If script doesn't work, manually edit .env:

```bash
cp .env .env.backup
nano .env
```

Add these lines:
```
FORCE_MONGODB=true
DATABASE_URL=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/jellyfin_signup
```

Then restart:
```bash
docker-compose restart
```