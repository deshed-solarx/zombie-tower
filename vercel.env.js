// Environment configuration for Vercel deployment
export default {
  // Define environment variables that should be available during build
  buildEnvironment: {
    // Pass any required variables for build time
    NODE_ENV: 'production',
    USE_CDN_FALLBACK: 'true',
  },
  
  // Runtime environment variables (these won't be exposed to the client)
  serverEnvironment: {
    // These will be available to serverless functions but not client code
    NODE_ENV: 'production',
  }
};