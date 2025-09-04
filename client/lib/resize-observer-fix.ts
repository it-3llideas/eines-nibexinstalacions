// Suppress ResizeObserver loop errors
// This is a known issue with some UI libraries and doesn't affect functionality

const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Suppress ResizeObserver errors globally
export const suppressResizeObserverError = () => {
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string') {
      const errorMessage = args[0].toLowerCase();
      // Check for various ResizeObserver error patterns
      if (
        errorMessage.includes('resizeobserver loop completed') ||
        errorMessage.includes('resizeobserver loop limit exceeded') ||
        errorMessage.includes('resizeobserver') && errorMessage.includes('loop')
      ) {
        // Silently ignore ResizeObserver errors
        return;
      }
    }
    originalError.apply(console, args);
  };

  // Also handle window error events for ResizeObserver
  const originalWindowError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (typeof message === 'string' && message.toLowerCase().includes('resizeobserver')) {
      return true; // Prevent default error handling
    }
    if (originalWindowError) {
      return originalWindowError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Handle unhandled promise rejections that might be ResizeObserver related
  const originalUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    if (event.reason && typeof event.reason === 'string') {
      const reason = event.reason.toLowerCase();
      if (reason.includes('resizeobserver')) {
        event.preventDefault();
        return;
      }
    }
    if (originalUnhandledRejection) {
      originalUnhandledRejection(event);
    }
  };
};

// Initialize on import
suppressResizeObserverError();
