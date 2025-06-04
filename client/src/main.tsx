import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Silently handle common network errors to reduce console spam
  if (event.reason?.message?.includes('fetch') || 
      event.reason?.message?.includes('Failed to fetch') ||
      event.reason?.status === 401 || 
      event.reason?.status === 404 ||
      event.reason?.name === 'AbortError') {
    event.preventDefault();
    return;
  }
  
  console.warn('Promise rejection handled:', event.reason);
  event.preventDefault();
});

// Global error handling for uncaught errors
window.addEventListener('error', (event) => {
  // Prevent crashes from minor errors
  if (event.error?.name === 'ChunkLoadError' || 
      event.error?.message?.includes('Loading chunk')) {
    window.location.reload();
    return;
  }
  
  console.warn('Error handled:', event.error);
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
