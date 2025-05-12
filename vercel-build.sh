#!/bin/bash
# Script to build only the client-side application for Vercel deployment

# Run the Vite build to create the static files
npm run build

# Don't run the server build process for Vercel static deployments
# This is what was causing the server code to be shown instead of the client app
echo "Static build completed successfully!"