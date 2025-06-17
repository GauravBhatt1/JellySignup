# VPS Deployment Guide

## Quick Setup Commands

1. **Clone and setup**
   ```bash
   git clone <your-repo-url>
   cd jellyfin-signup
   cp .env.example .env
   nano .env
   ```

2. **Configure .env file**
   ```env
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/jellyfin_signup
   JELLYFIN_SERVER_URL=http://192.168.1.100:8096
   JELLYFIN_API_KEY=your_jellyfin_api_key
   TMDB_API_KEY=your_tmdb_api_key
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_secure_password
   SESSION_SECRET=random_secret_key_here
   ```

3. **Deploy with Docker**
   ```bash
   docker-compose up -d
   ```

4. **Check status**
   ```bash
   docker-compose ps
   docker-compose logs -f jellyfin-signup
   ```

## Access Points
- Signup Portal: `http://your-vps-ip:5000`
- Admin Dashboard: `http://your-vps-ip:5000/admin`
- Health Check: `http://your-vps-ip:5000/health`

## Troubleshooting
- Check logs: `docker-compose logs -f`
- Restart: `docker-compose restart`
- Rebuild: `docker-compose down && docker-compose up -d`