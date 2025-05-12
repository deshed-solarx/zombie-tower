#!/bin/bash

# Set strict error handling
set -e

# Create the output directory
mkdir -p dist/public

# Copy the index.html file to the output directory
cp index.html dist/public/

# Include any assets if needed
# mkdir -p dist/public/assets
# cp -r assets/* dist/public/assets/ 2>/dev/null || :

echo "Build completed successfully!"