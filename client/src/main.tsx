import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/main.css';

// Async function to check if Notion integration is set up
async function checkNotionSetup() {
  try {
    // Detect API URL based on environment
    const isVercel = typeof window !== 'undefined' && 
                    window.location.hostname.includes('vercel.app');
    
    const API_URL = import.meta.env.PROD 
      ? isVercel ? '/api/leaderboard' : '/api/leaderboard'
      : import.meta.env.DEV 
        ? 'http://localhost:5000/api/leaderboard'
        : '/api/leaderboard';
        
    console.log('Checking API connectivity with URL:', API_URL);
    
    // Try to fetch data from the leaderboard API
    const response = await fetch(API_URL);
    const data = await response.json();
    
    // Log the status for debugging
    console.log('Notion API status:', data.success ? 'Connected' : 'Not connected');
    
    return data.success;
  } catch (error) {
    console.error('Error checking API connectivity:', error);
    // Don't fail the application startup due to API issues
    return false;
  }
}

// Simplified application setup
async function setupApplication() {
  try {
    // Check if Notion is set up (we don't block on this, just log it)
    await checkNotionSetup();
    
    // Render the app regardless of Notion status
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (error) {
    console.error('Error during application setup:', error);
    
    // Render the app anyway in case of errors
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
}

// Start the application
setupApplication();