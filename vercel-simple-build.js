const fs = require('fs');
const path = require('path');

// Create the output directory
const outputDir = path.resolve(__dirname, 'dist/public');
fs.mkdirSync(outputDir, { recursive: true });

// Copy the index.html file to the output directory
fs.copyFileSync(path.resolve(__dirname, 'index.html'), path.resolve(outputDir, 'index.html'));

console.log('Simple build completed successfully!');