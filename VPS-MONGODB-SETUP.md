# VPS MongoDB Setup Guide

## Problem Identified
Your VPS is detecting PostgreSQL instead of MongoDB. This is causing the trial settings update to fail.

## Solution

### 1. Check Current Environment
```bash
# On your VPS, check what DATABASE_URL is set
echo $DATABASE_URL
```

### 2. Update .env File on VPS
Make sure your `.env` file on VPS has MongoDB connection string:

```bash
# Edit .env file on VPS
nano .env
```

Add/Update this line:
```
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/jellyfin_signup
```

### 3. Restart Docker Container
```bash
# Stop and restart container
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 4. Verify MongoDB Connection
Check health endpoint to confirm MongoDB is detected:
```bash
curl http://localhost:5000/health
```

Should show:
```json
{
  "databaseType": "MongoDB"
}
```

## Quick Fix Commands

Run these on your VPS:

```bash
# 1. Update environment
echo 'DATABASE_URL=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/jellyfin_signup' >> .env

# 2. Restart application
docker-compose restart

# 3. Test
curl http://localhost:5000/health
```

## Debug Trail Settings Issue

After MongoDB is properly connected, the trial settings should save without errors.