// API configuration for different environments

// Check if we're in a static deployment (like Vercel)
const isStaticDeployment = import.meta.env.VITE_STATIC_DEPLOYMENT === 'true';

// Base API URL - defaults to relative path for same-origin requests
export const API_BASE_URL = isStaticDeployment 
  ? 'https://your-backend-api-url.com' // Replace with your actual backend API URL if you set one up
  : '/api';

// For static deployments without a backend, we can provide mock functionality
export const isBackendAvailable = !isStaticDeployment;

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('API Configuration:', {
    isStaticDeployment,
    API_BASE_URL,
    isBackendAvailable
  });
}