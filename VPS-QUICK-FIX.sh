#!/bin/bash

echo "VPS MongoDB Trial Settings Quick Fix"
echo "===================================="

# Check if we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: Run this script from your jellyfin-signup directory"
    exit 1
fi

echo "Step 1: Checking current environment..."
echo "Current DATABASE_URL detection:"
if grep -q "mongodb" .env 2>/dev/null; then
    echo "MongoDB URL found in .env"
else
    echo "MongoDB URL not detected in .env"
fi

echo ""
echo "Step 2: Adding MongoDB force flag..."
if ! grep -q "FORCE_MONGODB" .env 2>/dev/null; then
    echo "FORCE_MONGODB=true" >> .env
    echo "Added FORCE_MONGODB=true to .env"
else
    echo "FORCE_MONGODB already exists"
fi

echo ""
echo "Step 3: Ensuring proper MongoDB URL format..."
if ! grep -q "mongodb+srv://" .env 2>/dev/null && ! grep -q "mongodb://" .env 2>/dev/null; then
    echo "WARNING: No MongoDB URL detected in .env file"
    echo "Please add: DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/jellyfin_signup"
    echo "Or update your existing DATABASE_URL to use MongoDB format"
fi

echo ""
echo "Step 4: Restarting Docker containers..."
docker-compose down
sleep 2
docker-compose up -d

echo ""
echo "Step 5: Waiting for service to start..."
sleep 10

echo ""
echo "Step 6: Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:5000/health 2>/dev/null)
if echo "$HEALTH_RESPONSE" | grep -q "MongoDB"; then
    echo "Success! MongoDB detected:"
    echo "$HEALTH_RESPONSE"
else
    echo "Still showing PostgreSQL. Manual .env update needed:"
    echo "$HEALTH_RESPONSE"
    echo ""
    echo "Manual fix required:"
    echo "1. Edit .env file: nano .env"
    echo "2. Update DATABASE_URL to MongoDB format"
    echo "3. Run: docker-compose restart"
fi

echo ""
echo "Step 7: Testing trial settings..."
echo "Try updating trial settings in admin panel now."
echo ""
echo "To check logs: docker-compose logs -f"
echo "To check health: curl http://localhost:5000/health"