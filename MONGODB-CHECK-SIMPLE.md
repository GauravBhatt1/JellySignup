# VPS MongoDB Connection Check

## Quick Commands

```bash
# 1. Check health endpoint
curl http://localhost:5000/health

# 2. Check current .env settings
cat .env | grep DATABASE_URL
cat .env | grep FORCE_MONGODB

# 3. Check application logs
docker-compose logs | grep "Storage Configuration"

# 4. Check container status
docker-compose ps
```

## What to Look For

### Health Endpoint Response
**Good (MongoDB working):**
```json
{"databaseType": "MongoDB"}
```

**Bad (PostgreSQL detected):**
```json
{"databaseType": "PostgreSQL"}
```

### Storage Configuration Logs
**Good (MongoDB working):**
```
Using storage: MongoDB
```

**Bad (Memory storage):**
```
Using storage: Memory
```

## Fix If MongoDB Not Detected

```bash
# Add MongoDB force flag
echo "FORCE_MONGODB=true" >> .env

# Update DATABASE_URL to MongoDB format
nano .env
# Change DATABASE_URL to: mongodb+srv://username:password@cluster.mongodb.net/jellyfin_signup

# Restart containers
docker-compose restart

# Verify fix
curl http://localhost:5000/health
```