#!/bin/bash

# Create the output directory
mkdir -p dist/public

# Copy the index.html file to the output directory
cp index.html dist/public/

echo "Build completed successfully!"