#!/bin/bash

echo "🚀 Starting VPS Deployment..."

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Remove old images
echo "Cleaning up old images..."
docker image prune -f

# Build fresh image
echo "Building fresh Docker image..."
docker-compose build --no-cache

# Start services
echo "Starting services..."
docker-compose up -d

# Check status
echo "Checking container status..."
docker-compose ps

# Show logs
echo "Recent logs:"
docker-compose logs --tail=20

echo "✅ Deployment complete!"
echo "Access your app at: http://your-vps-ip:5000"
echo "Admin panel: http://your-vps-ip:5000/admin"

# Wait a moment and check health
sleep 5
echo "Health check:"
curl -f http://localhost:5000/health || echo "Health check failed - check logs above"