#!/bin/bash

# FlowDesk Deployment Script
# Usage: ./deploy.sh [dev|staging|prod]

set -e

ENV=${1:-dev}

echo "🚀 Deploying FlowDesk to $ENV environment..."

case $ENV in
  dev)
    echo "📦 Starting local development environment..."
    docker-compose up -d db redis
    sleep 5
    npm run db:generate
    npm run db:push
    echo "✅ Development environment ready!"
    echo "   - Web: http://localhost:3000"
    echo "   - WebSocket: http://localhost:3020"
    echo "   - Database: localhost:5432"
    echo "   - Redis: localhost:6379"
    ;;
    
  staging|prod|production)
    echo "🔒 Checking environment configuration..."
    if [ ! -f .env ]; then
      echo "❌ .env file not found!"
      echo "   Copy .env.example to .env and configure it first."
      exit 1
    fi
    
    echo "🏗️  Building and starting production containers..."
    docker-compose -f docker-compose.yml up -d --build
    
    echo "⏳ Waiting for services to be healthy..."
    sleep 10
    
    echo "📊 Service status:"
    docker-compose ps
    
    echo "✅ Deployment complete!"
    echo "   Check logs with: docker-compose logs -f"
    ;;
    
  *)
    echo "❌ Unknown environment: $ENV"
    echo "   Usage: ./deploy.sh [dev|staging|prod]"
    exit 1
    ;;
esac
