# Jellyfin Signup Portal

A comprehensive Jellyfin user registration and management platform with advanced trial system, admin controls, and VPS deployment optimization.

## Features

- **🚀 Streamlined User Registration**: Username availability checking with instant Jellyfin integration
- **🛡️ Admin Approval Workflow**: Optional approval gate for new signups before Jellyfin accounts are created
- **🔎 Account Status Checker**: Pending users can check whether their request is pending, approved, or rejected
- **⏰ Advanced Trial Management**: Configurable trial periods with automatic expiration processing
- **👨‍💼 Powerful Admin Dashboard**: Complete user management with bulk operations, CSV export, and account controls
- **🗑️ Recycle Bin Safety**: Deleted usernames can be restored or permanently removed by an admin
- **🎞️ Demand Tracking**: Track requested movies/shows and mark them pending, added, rejected, or ignored
- **❤️ Server Health Checks**: Admin-only health view for app, database, Jellyfin, and runtime checks
- **🔒 Enterprise Security**: Rate limiting, input validation, and secure session management
- **📱 Mobile-First Design**: Responsive interface with dark/light themes
- **🐳 Production-Ready Deployment**: Optimized Docker configuration for VPS deployment
- **🗄️ Flexible Database Support**: Auto-detection between PostgreSQL (dev) and MongoDB (prod)

## Screenshots

Screenshots below use demo data so the README can show the interface without exposing real users.

### Signup with Admin Approval

![Signup screen with admin approval notice and account status checker](docs/screenshots/signup-approval-required.png)

### Admin Approval Queue

![Admin approval queue with pending, approved, and rejected requests](docs/screenshots/admin-approvals.png)

### User Management Dashboard

![Admin user management dashboard with totals, CSV export, filters, and user actions](docs/screenshots/admin-user-management.png)

### Mobile Admin Approval View

![Mobile admin approval queue with responsive request cards](docs/screenshots/mobile-admin-approvals.png)

## Latest Admin Approval Flow

When **Require Admin Approval** is ON, the signup portal no longer creates the Jellyfin account immediately. Instead, it stores a pending request with the username, password hash, encrypted password payload, timestamp, and request status.

Admins can open **Admin Console → Approvals** to:

- Turn approval mode ON or OFF
- See pending, approved, and rejected request counts
- Approve a request, which creates the Jellyfin user using the original requested password
- Reject a request, which blocks that username/password status check from becoming a Jellyfin login

Users see a clear approval notice on the signup form. After requesting an account, they can use **Check Account Status** with the same username and password to see whether the account is still pending, has been approved, or was rejected.

Approval settings and requests are stored through the production storage layer, with MongoDB support and a JSON fallback/migration path for older deployments.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript + MongoDB/PostgreSQL
- **APIs**: Jellyfin API + TMDB API for trending content
- **Deployment**: Docker + Docker Compose + Portainer ready
- **Security**: Rate limiting + Session management + Input validation

## VPS Deployment Guide

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

## Configuration

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

### Admin Approval Configuration
- **Approval Mode**: Toggle whether new signups require manual admin review
- **Pending Queue**: Review every account request before account creation
- **Approve/Reject Actions**: Create Jellyfin users on approval or block rejected requests
- **Status Lookup**: Let users check request state with their original credentials

## Admin Features

### User Management
- ✅ View all Jellyfin users
- ✅ Enable/disable users
- ✅ Delete users
- ✅ Bulk operations
- ✅ Download permissions toggle
- ✅ Reset user passwords
- ✅ Export filtered users to CSV
- ✅ Filter inactive or never-logged-in accounts

### Trial Management
- ✅ Configure trial settings
- ✅ Monitor active trials
- ✅ Process expired trials
- ✅ View trial statistics
- ✅ Export user data

### Approval Management
- ✅ Require admin approval for new signups
- ✅ Review pending account requests
- ✅ Approve requests and create Jellyfin accounts
- ✅ Reject requests with visible user status
- ✅ Mobile-friendly approval cards

### Safety and Operations
- ✅ Recycle bin for deleted users
- ✅ Server health status page
- ✅ Demand/request tracking for content requests

## Docker Features

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

## Security Features

- **Rate Limiting**: Prevents signup abuse (5 attempts per IP per 15 minutes)
- **Input Validation**: Zod schemas for all user inputs
- **Session Security**: Secure cookies with HTTPS support
- **Environment Isolation**: Production/development configurations
- **API Key Protection**: Environment-based secret management
- **Admin-Only Controls**: Approval queue, user actions, health, trials, recycle bin, and demand pages require admin session auth
- **Encrypted Pending Passwords**: Approval requests keep the original password encrypted until admin approval creates the Jellyfin account

## Troubleshooting

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

## API Endpoints

### Public Endpoints
- `GET /health` - Health check for monitoring
- `POST /api/jellyfin/users` - Create new user
- `GET /api/trending-movies` - Get background content
- `GET /api/trial-info` - Get trial configuration
- `GET /api/approval-info` - Get public approval-mode status
- `POST /api/account-status` - Check pending/approved/rejected account request state

### Admin Endpoints
- `GET /api/admin/users` - List Jellyfin users
- `POST /api/admin/users/action` - Enable, disable, delete, reset password, bulk-disable, or toggle downloads
- `GET /api/admin/trial-settings` - Get trial settings
- `PUT /api/admin/trial-settings` - Update trial settings
- `GET /api/admin/trial-users` - List trial users
- `POST /api/admin/process-expired-trials` - Process expired trials
- `GET /api/admin/approval-settings` - Get approval settings
- `PUT /api/admin/approval-settings` - Update approval settings
- `GET /api/admin/approval-requests` - List signup approval requests
- `POST /api/admin/approval-requests/:id/action` - Approve or reject a signup request
- `GET /api/admin/server-health` - Get live dependency health checks
- `GET /api/admin/demand` - List demand/request records
- `POST /api/admin/demand` - Add a demand/request record
- `DELETE /api/admin/demand/:id` - Delete a demand/request record

## Development

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

## License

MIT License - see LICENSE file for details

## Support

Having issues? Check these first:
1. ✅ All environment variables are set correctly
2. ✅ MongoDB Atlas allows connections from your VPS IP
3. ✅ Jellyfin server is accessible from VPS
4. ✅ Docker containers are running: `docker-compose ps`
5. ✅ Check logs: `docker-compose logs -f`

For advanced troubleshooting, check the health endpoint: `http://your-vps:5000/health`
