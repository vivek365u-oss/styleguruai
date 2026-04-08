/**
 * API Retry & Keep-Alive System
 * - Retries failed requests automatically (3 times)
 * - Sends keep-alive ping every 10 minutes to prevent backend timeout
 */

let keepAliveInterval = null;

/**
 * Retry a promise-returning function up to maxRetries times
 */
export const retryRequest = async (requestFn, maxRetries = 3, delayMs = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      console.warn(`Retry ${i + 1}/${maxRetries} failed:`, error.message);
      
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

/**
 * Start keep-alive system - sends ping every 10 minutes
 */
export const startKeepAlive = (pingFn) => {
  if (keepAliveInterval) return; // Already running
  
  // Send initial ping
  pingFn().catch(err => console.warn('Keep-alive ping failed:', err));
  
  // Send ping every 10 minutes
  keepAliveInterval = setInterval(() => {
    pingFn().catch(err => console.warn('Keep-alive ping failed:', err));
  }, 10 * 60 * 1000);
  
  console.log('Keep-alive system started (ping every 10 min)');
};

/**
 * Stop keep-alive system
 */
export const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('Keep-alive system stopped');
  }
};

/**
 * Backend health check (ping) - Fast endpoint for keep-alive
 */
export const healthCheck = async (apiInstance) => {
  try {
    // Health check should be faster - use 10s timeout instead of 5s
    const response = await apiInstance.get('/health', { 
      timeout: 10000 // Increased from 5000ms to 10s
    });
    return !!response.data;
  } catch (err) {
    console.warn('[HealthCheck] Ping failed:', err.message);
    return false;
  }
};
