// Create environment variables for Vercel build
import fs from 'fs';

console.log('Creating environment variables for Vercel build...');

// Create a .env file for Vite to use during build
const envContent = `
# Vercel environment variables
VITE_IS_VERCEL=true
VITE_STATIC_MODE=true
`;

fs.writeFileSync('.env', envContent);
console.log('✅ Created .env file with Vercel config');

// Also add these to the process.env for this build
process.env.VITE_IS_VERCEL = 'true';
process.env.VITE_STATIC_MODE = 'true';

console.log('Environment variables created successfully!');