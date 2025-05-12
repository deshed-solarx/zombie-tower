import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the output directory
const outputDir = path.resolve(__dirname, 'dist/public');
fs.mkdirSync(outputDir, { recursive: true });

// Copy the index.html file to the output directory
fs.copyFileSync(path.resolve(__dirname, 'index.html'), path.resolve(outputDir, 'index.html'));

console.log('Simple build completed successfully!');