import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Check if it's a network error or auth error
  if (event.reason?.message?.includes('fetch') || 
      event.reason?.status === 401 || 
      event.reason?.status === 404) {
    console.warn('Network or auth error caught, handling gracefully');
  }
  
  // Prevent the default browser behavior of logging to console
  event.preventDefault();
});

// Global error handling for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  
  // Don't let the app crash on minor errors
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
