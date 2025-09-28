#!/bin/bash

echo "🔧 Heroku Build Script Starting..."
echo "Environment: $NODE_ENV"
echo "Build directory: $PWD"

# Install dependencies with production=false
echo "📦 Installing dependencies..."
NPM_CONFIG_PRODUCTION=false npm install --force --legacy-peer-deps --no-audit --no-fund

# Build using Heroku-specific config
echo "🏗️ Building with Heroku config..."
npx vite build --config ./vite.config.heroku.ts

# Prune to production dependencies
echo "🧹 Pruning to production dependencies..."
npm prune --production

echo "✅ Heroku build complete!"