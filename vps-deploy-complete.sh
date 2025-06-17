#!/bin/bash

# Complete VPS Deployment Script
echo "🚀 Starting Complete VPS Deployment..."

# Step 1: Environment Check
echo "Checking environment..."
if [ ! -f ".env" ]; then
    echo "❌ .env file not found! Creating from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual values before continuing"
    exit 1
fi

# Step 2: Clean existing containers and images
echo "Cleaning existing Docker resources..."
docker-compose down --remove-orphans 2>/dev/null || true
docker system prune -f 2>/dev/null || true

# Step 3: Build with verbose output for debugging
echo "Building Docker image with verbose output..."
docker-compose build --no-cache --progress=plain

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

# Step 4: Start services
echo "Starting services..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start services!"
    exit 1
fi

# Step 5: Wait for startup
echo "Waiting for application to start..."
sleep 10

# Step 6: Health check
echo "Performing health check..."
for i in {1..5}; do
    if curl -f http://localhost:5000/health 2>/dev/null; then
        echo "✅ Application is healthy!"
        break
    else
        echo "Attempt $i/5: Waiting for application..."
        sleep 5
    fi
done

# Step 7: Show status
echo "=== Container Status ==="
docker-compose ps

echo "=== Recent Logs ==="
docker-compose logs --tail=20 jellyfin-signup

echo "=== Access Information ==="
echo "Main Application: http://your-vps-ip:5000"
echo "Admin Dashboard: http://your-vps-ip:5000/admin"
echo "Health Check: http://your-vps-ip:5000/health"

echo "🎉 VPS Deployment Complete!"