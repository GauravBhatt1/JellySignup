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

## 📱 Screenshots

### 🏠 Homepage with Trial Notice
Beautiful landing page with dynamic movie backgrounds and trial mode information.

### 📝 User Signup Form
![Signup Form with Password Strength](https://i.imgur.com/signup-form.png)
- Real-time password strength validation
- Trial period display
- Clean material design

### 🔐 Admin Login
![Admin Authentication](https://i.imgur.com/admin-login.png)
- Jellyfin admin credentials authentication
- "Back to Home" navigation
- Secure session management

### 🎛️ Admin Dashboard - Desktop
![Desktop Admin Dashboard](https://i.imgur.com/admin-dashboard-desktop.png)
- Complete user management interface
- Bulk selection and actions
- User analytics and filtering

### 📱 Admin Dashboard - Mobile
![Mobile Admin Interface](https://i.imgur.com/admin-dashboard-mobile.png)
- Mobile-optimized icon-only buttons
- Responsive table design
- Touch-friendly bulk operations

### ⚙️ Trial Management
![Trial Settings Panel](https://i.imgur.com/trial-management.png)
- Configure trial duration (1-30 days)
- Expiry action settings
- Real-time trial user tracking

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

### Step 1: Prepare the Environment File

1. Create a `.env` file based on the example:
   ```
   JELLYFIN_API_KEY=your_jellyfin_api_key_here
   JELLYFIN_SERVER_URL=your_jellyfin_server_url_here
   TMDB_API_KEY=your_tmdb_api_key_here
   SESSION_SECRET=auto_generated_if_not_provided
   ```

2. Replace the values with your actual Jellyfin API key and server URL.

3. For TMDB_API_KEY, get a free API key from [The Movie Database](https://www.themoviedb.org/settings/api) to enable the background movie posters.

4. The SESSION_SECRET will be auto-generated if not provided, but for production you can generate a secure random string with:
   ```bash
   # Run this command to generate a secure SESSION_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Step 2: Deploy with Portainer

#### Option 1: Using the Docker Compose Stack

1. In Portainer, go to "Stacks" and click "Add stack"
2. Give it a name like "jellyfin-signup"
3. In the "Web editor" tab, paste the content of your `docker-compose.yml` file
4. Click "Deploy the stack"

#### Option 2: Using Docker Compose CLI

If you prefer using the command line:

1. Upload the entire project to your VPS (using SCP, SFTP, or Git)
2. Navigate to the project directory
3. Run `docker-compose up -d`

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