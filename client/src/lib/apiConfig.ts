// API configuration for different environments

// Detect if we're in a Vercel deployment
const isVercelDeployment = process.env.IS_VERCEL_DEPLOYMENT === 'true' || import.meta.env.VITE_IS_VERCEL === 'true';

// For static deployments (like Vercel), we can use a relative path for serverless functions
export const API_BASE_URL = '/api';

// Whether to use static mode (client-side only features)
export const isStaticMode = process.env.STATIC_BUILD === 'true' || import.meta.env.VITE_STATIC_MODE === 'true' || isVercelDeployment;

// Export configuration object
export const API_CONFIG = {
  isVercelDeployment,
  API_BASE_URL,
  isStaticMode
};

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('API Configuration:', API_CONFIG);
}

export default API_CONFIG;