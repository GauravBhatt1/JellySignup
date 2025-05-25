# Jellyfin Signup & User Management Platform

A clean and efficient Jellyfin user registration and management system for self-hosted media servers.

## Features

### User Registration
- Clean, responsive signup form  
- Real-time username availability checking
- Password strength validation
- Automatic Jellyfin user creation
- Download permission management

### Admin Dashboard
- Secure admin authentication using Jellyfin credentials
- User management (enable/disable, reset passwords)
- Bulk operations for multiple users
- Download permission controls
- Trial user monitoring and management

### Trial Management System
- Configurable trial duration (1-30 days)
- Automatic trial expiry handling
- Trial status indicators
- Bulk actions for expired trials
- Custom expiry actions (disable/delete)

### Security & Performance
- Rate limiting for signup attempts
- Session management
- Input validation and sanitization
- Mobile-responsive design

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Deployment
```bash
# Build and run with Docker
docker-compose up -d
```

## Environment Variables

```env
JELLYFIN_SERVER_URL=https://your-jellyfin-server.com
JELLYFIN_API_KEY=your_jellyfin_api_key
TMDB_API_KEY=your_tmdb_api_key
SESSION_SECRET=your_random_session_secret
DATABASE_URL=your_database_connection_string
```

## Getting API Keys

**Jellyfin API Key:**
1. Log into Jellyfin admin dashboard
2. Go to Dashboard → API Keys  
3. Create new API key

**TMDB API Key (Optional):**
1. Create account at themoviedb.org
2. Go to Settings → API
3. Request API key

## Admin Access

- Access at `/admin`
- Login with Jellyfin admin credentials
- Manage users and trial settings

## License

MIT License