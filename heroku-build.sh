#!/bin/bash

echo "🔧 Heroku Build Script Starting..."
echo "Environment: $NODE_ENV"
echo "Build directory: $PWD"

# Install dependencies with production=false for build
echo "📦 Installing dependencies..."
NPM_CONFIG_PRODUCTION=false npm install --force --legacy-peer-deps --no-audit --no-fund

# Build using Heroku-specific config
echo "🏗️ Building with Heroku config..."
npx vite build --config ./vite.config.heroku.ts

# Clean up large unnecessary files
echo "🧹 Cleaning up large files..."
rm -rf attached_assets/*.mp4 attached_assets/*.mov attached_assets/*.avi 2>/dev/null || true
rm -rf public 2>/dev/null || true
rm -rf client/public 2>/dev/null || true

# Prune to production dependencies ONLY
echo "🧹 Pruning to production dependencies..."
NPM_CONFIG_PRODUCTION=true npm prune --production

# Clean node_modules further
echo "🗑️ Removing dev-only packages..."
rm -rf node_modules/@types 2>/dev/null || true
rm -rf node_modules/typescript 2>/dev/null || true
rm -rf node_modules/vite 2>/dev/null || true
rm -rf node_modules/@vitejs 2>/dev/null || true

echo "✅ Heroku build complete!"
echo "📊 Final sizes:"
du -sh dist node_modules 2>/dev/null || true