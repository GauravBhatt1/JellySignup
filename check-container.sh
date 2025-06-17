#!/bin/bash

echo "🔍 Checking Docker container status..."

# Check if container is running
echo "Container status:"
docker-compose ps

echo ""
echo "Container logs (last 20 lines):"
docker-compose logs --tail=20 jellyfin-signup

echo ""
echo "Health check:"
curl -f http://localhost:5000/health 2>/dev/null || echo "Health endpoint not responding"

echo ""
echo "Testing direct container access:"
docker-compose exec jellyfin-signup node --version 2>/dev/null || echo "Container not accessible"