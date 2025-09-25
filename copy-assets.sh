#!/bin/bash
# Copy attached_assets to dist directory for production deployment
echo "📁 Copying assets for production deployment..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Copy attached_assets to dist
cp -r attached_assets dist/

echo "✅ Assets copied successfully!"
echo "📂 Assets are now available at: dist/attached_assets/"