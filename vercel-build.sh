#!/bin/bash
# Script to build only the client-side application for Vercel deployment

# Make sure the output directory exists
mkdir -p dist/public

# Copy the 404.html to the output directory to handle client-side routing
cp client/public/404.html dist/public/404.html 2>/dev/null || :
cp client/vercel.html dist/public/vercel.html 2>/dev/null || :

# Move to the client directory before running the build
cd client

# Build using the Vercel-specific config
npx vite build --config vite.config.vercel.ts

# Ensure the 404.html file exists in the output directory
if [ ! -f "../dist/public/404.html" ]; then
  cp public/404.html ../dist/public/404.html 2>/dev/null || echo "Warning: 404.html file not copied"
fi

echo "Client-side build completed successfully for Vercel deployment!"