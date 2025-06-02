#!/bin/bash

# Default database values - can be overridden by environment variables
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USERNAME="${DB_USERNAME:-authcakes_user}"
DB_PASSWORD="${DB_PASSWORD:-local-password}"
DB_NAME="${DB_NAME:-authcakes_test}"

echo "⚠️ Creating test database if it doesn't exist..."
echo "Database: $DB_NAME on $DB_HOST:$DB_PORT"

# Check if database exists
DB_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" = "1" ]; then
    echo "✅ Test database '$DB_NAME' already exists."
else
    echo "🔄 Creating test database '$DB_NAME'..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -c "CREATE DATABASE $DB_NAME;"
    RESULT=$?
    if [ $RESULT -eq 0 ]; then
        echo "✅ Test database '$DB_NAME' created successfully!"
    else
        echo "❌ Failed to create test database. Error code: $RESULT"
        echo "Check your PostgreSQL credentials and permissions."
        exit 1
    fi
fi

echo "🔍 Setting up environment for test database..."
echo "NODE_ENV=test" > .env.test.local
echo "DB_TYPE=postgres" >> .env.test.local
echo "DB_HOST=$DB_HOST" >> .env.test.local
echo "DB_PORT=$DB_PORT" >> .env.test.local
echo "DB_USERNAME=$DB_USERNAME" >> .env.test.local
echo "DB_PASSWORD=$DB_PASSWORD" >> .env.test.local
echo "DB_NAME=$DB_NAME" >> .env.test.local
echo "DB_LOGGING=true" >> .env.test.local
echo "DB_SYNCHRONIZE=false" >> .env.test.local
echo "DB_MIGRATIONS_RUN=true" >> .env.test.local
echo "THROTTLE_SKIP=true" >> .env.test.local

echo "✅ Test database setup complete!"
echo "💡 Run tests with: npm run test:e2e"

# Make the script executable
chmod +x create-test-db.sh