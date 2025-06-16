# 🎬 Jellyfin Signup Portal

A comprehensive Jellyfin user registration and management platform with advanced trial system, admin controls, and VPS deployment optimization.

## ✨ Features

- **🚀 Streamlined User Registration**: Username availability checking with instant Jellyfin integration
- **⏰ Advanced Trial Management**: Configurable trial periods with automatic expiration processing
- **👨‍💼 Powerful Admin Dashboard**: Complete user management with bulk operations and analytics
- **🌍 Geographic Analytics**: Precise location tracking and user distribution insights
- **🔒 Enterprise Security**: Rate limiting, input validation, and secure session management
- **📱 Mobile-First Design**: Responsive interface with dark/light themes
- **🐳 Production-Ready Deployment**: Optimized Docker configuration for VPS deployment
- **🗄️ Flexible Database Support**: Auto-detection between PostgreSQL (dev) and MongoDB (prod)

## 🏗️ Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript + MongoDB/PostgreSQL
- **APIs**: Jellyfin API + TMDB API for trending content
- **Deployment**: Docker + Docker Compose + Portainer ready
- **Security**: Rate limiting + Session management + Input validation

## 🚀 VPS Deployment Guide

### Prerequisites
- VPS with Docker and Docker Compose installed
- MongoDB Atlas account (free tier works)
- Jellyfin server running on your network
- TMDB API key (free)

### Step 1: MongoDB Setup
1. Create free MongoDB Atlas account: https://cloud.mongodb.com/
2. Create new cluster and database user
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/jellyfin_signup`

### Step 2: Jellyfin API Key
1. Access your Jellyfin Dashboard
2. Go to Administration → API Keys
3. Create new API key for signup portal

### Step 3: TMDB API Key
1. Create account at: https://www.themoviedb.org/
2. Go to Settings → API
3. Get your API key (v3 auth)

### Step 4: Deploy on VPS

1. **Clone repository**
   ```bash
   git clone <your-repo-url>
   cd jellyfin-signup
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env
   ```
   
   Update with your values:
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

4. **Verify deployment**
   ```bash
   # Check container status
   docker-compose ps
   
   # Check logs
   docker-compose logs -f
   
   # Health check
   curl http://localhost:5000/health
   ```

### Step 5: Access Your Portal
- **Signup Portal**: `http://your-vps-ip:5000`
- **Admin Dashboard**: `http://your-vps-ip:5000/admin`
- **Health Check**: `http://your-vps-ip:5000/health`

## 🔧 Configuration

### Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB Atlas connection | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JELLYFIN_SERVER_URL` | Your Jellyfin server URL | `http://192.168.1.100:8096` |
| `JELLYFIN_API_KEY` | Jellyfin API key | `abcd1234efgh5678` |
| `TMDB_API_KEY` | TMDB API key | `xyz789abc123def456` |
| `ADMIN_USERNAME` | Admin panel username | `admin` |
| `ADMIN_PASSWORD` | Admin panel password | `SecurePassword123!` |
| `SESSION_SECRET` | Session encryption key | `random-secret-key` |

### Trial System Configuration
- **Trial Duration**: Set custom trial periods (default: 7 days)
- **Expiry Actions**: Choose between disable or delete expired users
- **Auto-Processing**: Bulk process expired trials with one click
- **Analytics**: Track trial conversion and geographic distribution

## 📱 Admin Features

### User Management
- ✅ View all Jellyfin users
- ✅ Enable/disable users
- ✅ Delete users
- ✅ Bulk operations
- ✅ Download permissions toggle
- ✅ Geographic analytics

### Trial Management
- ✅ Configure trial settings
- ✅ Monitor active trials
- ✅ Process expired trials
- ✅ View trial statistics
- ✅ Export user data

## 🐳 Docker Features

### Optimized for VPS Deployment
- **Multi-stage build** for smaller image size
- **Non-root user** for enhanced security
- **Health checks** for monitoring
- **Connection pooling** for MongoDB
- **Automatic restarts** with proper error handling

### Production Monitoring
```bash
# View real-time logs
docker-compose logs -f jellyfin-signup

# Check container health
docker-compose ps

# Monitor resource usage
docker stats

# Restart service
docker-compose restart jellyfin-signup
```

## 🔐 Security Features

- **Rate Limiting**: Prevents signup abuse (5 attempts per IP per 15 minutes)
- **Input Validation**: Zod schemas for all user inputs
- **Session Security**: Secure cookies with HTTPS support
- **Environment Isolation**: Production/development configurations
- **API Key Protection**: Environment-based secret management

## 🚨 Troubleshooting

### MongoDB Connection Issues
```bash
# Test MongoDB connection
docker-compose exec jellyfin-signup node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));
"
```

### Jellyfin API Issues
```bash
# Test Jellyfin API
curl -H "X-Emby-Token: YOUR_API_KEY" \
     "http://your-jellyfin-server:8096/jellyfin/Users"
```

### Container Issues
```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check detailed logs
docker-compose logs --tail=100 jellyfin-signup
```

## 📊 API Endpoints

### Public Endpoints
- `GET /health` - Health check for monitoring
- `POST /api/jellyfin/users` - Create new user
- `GET /api/trending-movies` - Get background content
- `GET /api/trial-info` - Get trial configuration

### Admin Endpoints
- `GET /api/admin/trial-settings` - Get trial settings
- `PUT /api/admin/trial-settings` - Update trial settings
- `GET /api/admin/trial-users` - List trial users
- `POST /api/admin/process-expired-trials` - Process expired trials

## 🛠️ Development

### Local Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Database Migration
```bash
npm run db:push
```

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

Having issues? Check these first:
1. ✅ All environment variables are set correctly
2. ✅ MongoDB Atlas allows connections from your VPS IP
3. ✅ Jellyfin server is accessible from VPS
4. ✅ Docker containers are running: `docker-compose ps`
5. ✅ Check logs: `docker-compose logs -f`

For advanced troubleshooting, check the health endpoint: `http://your-vps:5000/health`