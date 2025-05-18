# Jellyfin Signup Application

A web application that allows users to create accounts for your Jellyfin server.

## Features

- User-friendly signup form with username and password fields
- Password strength indicator
- Modern UI with responsive design
- Connects directly to your Jellyfin server API
- Disables downloads for new users automatically

## Deployment Instructions for VPS with Portainer

### Prerequisites

- Docker and Docker Compose installed on your VPS
- Portainer set up and running
- Your Jellyfin server running (either on the same VPS or accessible via network)

### Step 1: Prepare the Environment File

1. Create a `.env` file based on the example:
   ```
   JELLYFIN_API_KEY=your_jellyfin_api_key_here
   JELLYFIN_SERVER_URL=your_jellyfin_server_url_here
   ```

2. Replace the values with your actual Jellyfin API key and server URL

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