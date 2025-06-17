# VPS Final Setup - Production Ready

## Prerequisites Complete Checklist

### 1. MongoDB Atlas Setup
- [ ] Account created at cloud.mongodb.com
- [ ] Cluster deployed (free tier M0 sufficient)
- [ ] Database user created with read/write permissions
- [ ] Network access configured (add VPS IP or 0.0.0.0/0)
- [ ] Connection string copied

### 2. Jellyfin Configuration
- [ ] Jellyfin server running and accessible
- [ ] API key generated in Dashboard > Administration > API Keys
- [ ] Server URL confirmed (include port, usually :8096)

### 3. TMDB API Setup
- [ ] Account created at themoviedb.org
- [ ] API key generated in Settings > API
- [ ] Key tested with sample request

## VPS Deployment Commands

### One-Command Deployment
```bash
./vps-deploy-complete.sh
```

### Manual Step-by-Step
```bash
# 1. Create environment file
cp vps-production.env.example .env
nano .env  # Edit with your values

# 2. Clean previous deployment
docker-compose down --remove-orphans
docker system prune -f

# 3. Deploy
docker-compose build --no-cache
docker-compose up -d

# 4. Verify
docker-compose logs -f jellyfin-signup
curl http://localhost:5000/health
```

## Environment Variables Template
```env
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/jellyfin_signup
JELLYFIN_SERVER_URL=http://192.168.1.100:8096
JELLYFIN_API_KEY=32_character_api_key
TMDB_API_KEY=tmdb_api_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_password
SESSION_SECRET=random_32_char_string
```

## Success Verification

### 1. Container Health
```bash
docker-compose ps
# Should show "Up" status
```

### 2. Application Response
```bash
curl http://localhost:5000/health
# Should return JSON health status
```

### 3. Web Interface Access
- Main app: http://your-vps-ip:5000
- Admin panel: http://your-vps-ip:5000/admin

### 4. Log Verification
```bash
docker-compose logs jellyfin-signup | tail -20
# Should show successful startup messages
```

## Common VPS Issues Solutions

### Issue: Container Exits
Check logs: `docker-compose logs jellyfin-signup`
Common causes: MongoDB connection, missing env vars

### Issue: Build Fails
Solution: `docker system prune -a -f` then rebuild

### Issue: Port Conflict
Change external port in docker-compose.yml: `"5001:5000"`

### Issue: MongoDB Connection
Verify DATABASE_URL format and Network Access in Atlas

## Production Optimization

### Resource Limits
Add to docker-compose.yml:
```yaml
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

### Automatic Restart
```yaml
restart: unless-stopped
```

### Health Monitoring
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Maintenance Commands

### Update Application
```bash
git pull
docker-compose build --no-cache
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f jellyfin-signup
```

### Restart Service
```bash
docker-compose restart jellyfin-signup
```

### Backup Database
MongoDB Atlas handles backups automatically

## Security Considerations

1. Change default admin credentials
2. Use strong SESSION_SECRET (32+ characters)
3. Restrict MongoDB network access to VPS IP only
4. Keep Docker and system updated
5. Monitor logs for suspicious activity

This configuration is production-tested and optimized for VPS deployment.