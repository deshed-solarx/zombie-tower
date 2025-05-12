#!/bin/bash
# Script to build only the client-side application for Vercel deployment

# Move to the client directory before running the build
cd client

# Build using the Vercel-specific config
npx vite build --config vite.config.vercel.ts

echo "Client-side build completed successfully for Vercel deployment!"