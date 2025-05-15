import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/main.css';

// Async function to check if Notion integration is set up
async function checkNotionSetup() {
  try {
    // Try to fetch data from the leaderboard API
    const response = await fetch('/api/leaderboard');
    const data = await response.json();
    
    // Log the status for debugging
    console.log('Notion API status:', data.success ? 'Connected' : 'Not connected');
    
    return data.success;
  } catch (error) {
    console.error('Error checking Notion setup:', error);
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