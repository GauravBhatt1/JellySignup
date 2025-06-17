#!/bin/bash

echo "MongoDB Connection Check for VPS"
echo "================================"

# Check if we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: Run this script from your jellyfin-signup directory"
    exit 1
fi

echo "1. Checking current .env configuration..."
echo "----------------------------------------"
if [ -f ".env" ]; then
    echo "DATABASE_URL in .env:"
    grep "DATABASE_URL" .env 2>/dev/null || echo "No DATABASE_URL found"
    echo ""
    echo "FORCE_MONGODB in .env:"
    grep "FORCE_MONGODB" .env 2>/dev/null || echo "No FORCE_MONGODB found"
else
    echo "No .env file found"
fi

echo ""
echo "2. Checking application health..."
echo "---------------------------------"
HEALTH_RESPONSE=$(curl -s http://localhost:5000/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "Health endpoint response:"
    echo "$HEALTH_RESPONSE"
    
    if echo "$HEALTH_RESPONSE" | grep -q "MongoDB"; then
        echo ""
        echo "✅ SUCCESS: MongoDB detected in application"
    else
        echo ""
        echo "❌ ISSUE: MongoDB not detected"
        echo "Current database type: $(echo "$HEALTH_RESPONSE" | grep -o '"databaseType":"[^"]*"')"
    fi
else
    echo "❌ Cannot connect to application on port 5000"
    echo "Check if docker containers are running:"
    docker-compose ps
fi

echo ""
echo "3. Checking storage configuration in logs..."
echo "--------------------------------------------"
STORAGE_LOGS=$(docker-compose logs 2>/dev/null | grep "Storage Configuration" | tail -1)
if [ ! -z "$STORAGE_LOGS" ]; then
    echo "Latest storage configuration:"
    echo "$STORAGE_LOGS"
else
    echo "No storage configuration logs found"
fi

echo ""
echo "4. Container status..."
echo "---------------------"
docker-compose ps

echo ""
echo "5. MongoDB connection test results..."
echo "------------------------------------"
if echo "$HEALTH_RESPONSE" | grep -q "MongoDB"; then
    echo "✅ MongoDB connection: WORKING"
    echo "✅ Trial settings should save properly"
else
    echo "❌ MongoDB connection: NOT DETECTED"
    echo "❌ Trial settings will fail to save"
    echo ""
    echo "Fix required:"
    echo "1. Add: echo 'FORCE_MONGODB=true' >> .env"
    echo "2. Update DATABASE_URL to MongoDB format in .env"
    echo "3. Run: docker-compose restart"
fi