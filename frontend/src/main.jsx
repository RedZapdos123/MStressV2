import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Suppress console errors for demo
const originalError = console.error;
console.error = (...args) => {
  // Only log non-React errors silently
  if (typeof args[0] === 'string' && (
    args[0].includes('Warning:') || 
    args[0].includes('Failed to') ||
    args[0].includes('Error:')
  )) {
    return; // Suppress
  }
  originalError(...args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
