# Jellyfin Signup & Admin Management Platform

A comprehensive web application that provides user signup capabilities and advanced admin controls for your Jellyfin media server. Features include trial user management, bulk operations, and intelligent admin dashboard with real-time user tracking.

[![Jellyfin][jellyfin-shield]][jellyfin-url]
[![Docker][docker-shield]][docker-url]
[![PostgreSQL][postgres-shield]][postgres-url]
[![React][react-shield]][react-url]

[jellyfin-shield]: https://img.shields.io/badge/media%20server-jellyfin-00a4dc?style=for-the-badge&logo=jellyfin&logoColor=white
[jellyfin-url]: https://jellyfin.org/
[docker-shield]: https://img.shields.io/badge/container-docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[docker-url]: https://www.docker.com/
[postgres-shield]: https://img.shields.io/badge/database-postgresql-336791?style=for-the-badge&logo=postgresql&logoColor=white
[postgres-url]: https://www.postgresql.org/
[react-shield]: https://img.shields.io/badge/frontend-react-61DAFB?style=for-the-badge&logo=react&logoColor=black
[react-url]: https://reactjs.org/

## ✨ Key Features

### 🔐 User Management
- **Smart Signup Form**: Password strength indicator and real-time validation
- **Trial Mode**: Configurable trial periods (1-30 days) with automatic expiry
- **Bulk Operations**: Select and manage multiple users simultaneously
- **Download Control**: Granular permissions for user download capabilities

### 🎛️ Admin Dashboard
- **Jellyfin Integration**: Direct admin authentication using Jellyfin credentials
- **User Analytics**: Track inactive users, never-logged-in accounts
- **Bulk Actions**: Reset passwords, enable downloads, disable/delete users
- **Mobile Optimized**: Clean icon-based interface for mobile devices
- **Real-time Updates**: Live user data synchronization

### 🎨 Modern Interface
- **Dynamic Backgrounds**: TMDB API integration for trending movie backdrops
- **Glass Morphism**: Modern UI with backdrop blur effects
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark Theme**: Jellyfin-branded color scheme throughout

### 🚀 Deployment Options
- **Docker Support**: One-click deployment with Portainer
- **Multiple Databases**: PostgreSQL, SQLite, or Supabase support
- **VPS Ready**: Easy setup on personal servers
- **Rate Limiting**: Built-in protection against abuse

## ✨ Key Interface Features

### 🏠 Homepage with Trial Notice
Beautiful landing page with TMDB movie backgrounds and trial mode information display.

### 📝 User Signup Form  
- Real-time password strength validation with color indicators
- Trial period notice and duration display
- Clean glass-card design with dynamic backgrounds
- Username availability checking

### 🔐 Admin Login
- Jellyfin administrator credentials authentication
- "Back to Home" navigation button
- Secure session management with auto-redirect
- Rate limiting protection

### 🎛️ Admin Dashboard - Desktop View
- Complete user management interface
- Bulk selection with master checkbox
- Icon-only bulk actions (Reset, Downloads, Disable, Delete)
- User analytics and "Never Logged In" filtering
- Real-time user count display

### 📱 Admin Dashboard - Mobile View
- Mobile-optimized responsive design
- Clean icon-based bulk action buttons
- Touch-friendly selection interface
- Simplified table layout for small screens

### ⚙️ Trial Management System
- Configurable trial duration (1-30 days)
- Automatic expiry action settings (Disable/Delete)
- Real-time trial user tracking and statistics
- PostgreSQL/SQLite persistent storage

## 💾 Database Configuration

### Option 1: SQLite (Recommended for VPS)
Perfect for self-hosted deployments - completely free and file-based.

```env
# .env file
DATABASE_URL="file:./data/users.db"
```

**Setup:**
```bash
npm run db:push  # Creates tables automatically
npm start       # Ready to go!
```

### Option 2: Supabase (Free Cloud PostgreSQL)
500MB free tier with web dashboard.

```env
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

### Option 3: Local PostgreSQL
For advanced users with existing PostgreSQL setup.

## 🚀 VPS Deployment with Portainer

### Prerequisites

- Docker and Docker Compose installed on your VPS
- Portainer set up and running
- Your Jellyfin server running (either on the same VPS or accessible via network)

### Step 1: Complete Environment Configuration

Create a single `.env` file with all required settings:

```env
# Database Configuration (Choose one option)
DATABASE_URL=file:./data/users.db
# OR for Supabase: DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# Jellyfin Server Configuration
JELLYFIN_SERVER_URL=https://your-jellyfin-server.com
JELLYFIN_API_KEY=your-jellyfin-api-key

# TMDB API for Background Movies (Optional)
TMDB_API_KEY=your-tmdb-api-key

# Session Security
SESSION_SECRET=your-random-secret-key
```

**Required APIs:**
1. **Jellyfin API Key**: Get from Jellyfin Admin Dashboard → Settings → API Keys
2. **TMDB API Key**: Free from [The Movie Database](https://www.themoviedb.org/settings/api)

**Database Options:**
- **SQLite** (Recommended): Just use `file:./data/users.db` - completely free
- **Supabase**: Free 500MB PostgreSQL tier
- **Local PostgreSQL**: For advanced setups

### Step 2: Initialize Database

```bash
# Create database tables automatically
npm run db:push

# Start the application  
npm start
```

**Generate Secure Session Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Quick VPS Setup (Non-Docker)

For direct VPS deployment without Docker:

```bash
# Clone the repository
git clone https://github.com/your-username/jellyfin-signup.git
cd jellyfin-signup

# Install dependencies
npm install

# Create .env file (use the template above)
nano .env

# Initialize database
npm run db:push

# Start in production mode
npm start
```

### Step 4: Docker Deployment with Portainer

#### Option A: Portainer Stack Deployment
1. In Portainer → Stacks → Add stack
2. Name: `jellyfin-signup`
3. Paste your `docker-compose.yml` content
4. Add environment variables in the stack editor
5. Deploy the stack

#### Option B: Command Line Docker
```bash
# Upload project to VPS
git clone https://github.com/your-username/jellyfin-signup.git
cd jellyfin-signup

# Create .env file
nano .env

# Deploy with Docker Compose
docker-compose up -d
```

## 🎯 What's New

### ✨ Version 2.0 Features
- **Bulk User Management**: Select multiple users and perform batch operations
- **Trial Mode System**: Configurable trial periods (1-30 days) with automatic expiry
- **Mobile-Optimized Interface**: Clean icon-based design for mobile admin access
- **SQLite Database Support**: File-based storage for easy VPS deployment
- **Enhanced Security**: Built-in rate limiting and session management
- **Real-time Synchronization**: Live user data updates across all interfaces

### 🔧 Advanced Admin Capabilities
- **User Analytics Dashboard**: Track inactive users and login patterns
- **Batch Operations**: Reset passwords, manage downloads, enable/disable accounts
- **Intelligent Password Management**: Bulk password reset with secure defaults
- **Granular Permission Control**: Fine-tune download permissions per user
- **Trial User Monitoring**: Complete lifecycle management of trial accounts

## 🚀 Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Drizzle ORM
- **Database**: PostgreSQL / SQLite / Supabase
- **Authentication**: Jellyfin API integration
- **Deployment**: Docker + Portainer support

### Step 3: Configure Network (if needed)

If your Jellyfin server is running in a different Docker network:

1. Edit the `docker-compose.yml` file 
2. Uncomment the "external" network configuration
3. Set the name to match your existing Jellyfin network

### Step 4: Access the Application

Once deployed, your signup page will be available at:

```
http://your-vps-ip:5000
```

You may want to set up a reverse proxy (like Nginx or Traefik) to provide SSL 
and a custom domain name.

## Maintenance

- View logs: `docker logs jellyfin-signup`
- Restart: `docker restart jellyfin-signup`
- Update: Pull the latest code and rebuild with `docker-compose up -d --build`

## Environment Variables

- `JELLYFIN_API_KEY`: Your Jellyfin API key for authentication
- `JELLYFIN_SERVER_URL`: The URL of your Jellyfin server
- `TMDB_API_KEY`: Your TMDB API key for fetching movie backgrounds and posters
- `SESSION_SECRET`: Secret key for securing sessions (auto-generated if not provided)

## Keywords and Search Terms

- jellyfin signup app
- jellyfin registration form
- jellyfin account creation
- jellyfin user management
- create jellyfin account
- jellyfin media server account
- jellyfin open source signup
- media server account creation
- jellyfin admin dashboard
- plex emby alternative signup
- media server user management
- self-hosted media server account

## Support

If you need assistance with this application, please open an issue on the repository or contact the maintainer.