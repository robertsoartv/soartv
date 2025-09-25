import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handling to prevent popups from Firebase offline errors
window.addEventListener('unhandledrejection', (event) => {
  // Check if it's a Firebase offline error
  if (event.reason && 
      (event.reason.code === 'unavailable' || 
       event.reason.code === 'failed-precondition' ||
       event.reason.message?.includes('offline') ||
       event.reason.message?.includes('Failed to get document') ||
       event.reason.message?.includes('Request timeout'))) {
    console.log('🔄 Suppressed Firebase offline error:', event.reason.code || event.reason.message || 'offline');
    event.preventDefault(); // Prevent the error popup
  }
});

// Also handle general errors
window.addEventListener('error', (event) => {
  if (event.message?.includes('Failed to get document') ||
      event.message?.includes('offline')) {
    console.log('🔄 Suppressed Firebase offline error');
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
