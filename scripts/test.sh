#!/bin/bash

set -e

echo "🧪 Running SchedulEase test suite..."

# Ensure test database is ready
echo "🗄️  Preparing test database..."
docker-compose run --rm -e RAILS_ENV=test api bundle exec rails db:create db:migrate

# Run backend tests
echo "🔧 Running API tests..."
docker-compose run --rm -e RAILS_ENV=test api bundle exec rspec

# Run frontend tests
echo "⚛️  Running Frontend tests..."
docker-compose run --rm frontend npm test

echo "✅ All tests passed!" 