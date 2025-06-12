#!/bin/bash

set -e

echo "🚀 Setting up SchedulEase development environment..."

# Check for required tools
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Docker and Docker Compose found"

# Create .env files if they don't exist
if [ ! -f ./api/.env ]; then
  echo "📝 Creating API environment file..."
  cp ./api/.env.example ./api/.env 2>/dev/null || echo "⚠️  No .env.example found in api directory"
fi

if [ ! -f ./frontend/.env.local ]; then
  echo "📝 Creating Frontend environment file..."
  cp ./frontend/.env.example ./frontend/.env.local 2>/dev/null || echo "⚠️  No .env.example found in frontend directory"
fi

# Build and start services
echo "🐳 Building Docker containers..."
docker-compose build

echo "🗄️  Starting database and Redis..."
docker-compose up -d postgres redis

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "🏗️  Setting up database..."
docker-compose run --rm api bundle exec rails db:create db:migrate db:seed

echo "📦 Installing frontend dependencies..."
docker-compose run --rm frontend npm install

echo "✅ Setup complete!"
echo ""
echo "🎉 You can now start the application with:"
echo "   docker-compose up"
echo ""
echo "Services will be available at:"
echo "   - Frontend: http://localhost:3000"
echo "   - API: http://localhost:3001"
echo "   - API Docs: http://localhost:3001/api-docs" 