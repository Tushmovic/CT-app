
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { _seedDatabase } from './backend/api'; // Import the backend's seed function

// Seed the conceptual database on app load (simulating server initialization)
_seedDatabase();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Removed Service Worker registration as per the new architecture requirements.
// PWA offline functionality will be re-evaluated if needed in a future iteration.
