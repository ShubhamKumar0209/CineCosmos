import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true, // Crucial for sending HttpOnly cookies (JWTs)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle 401s (token expiration) and refresh logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401, we haven't retried yet, and it's NOT a login/refresh request
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      originalRequest.url !== '/auth/login' &&
      originalRequest.url !== '/auth/refresh'
    ) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        
        // If successful, retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token failed/expired
        // ONLY redirect if the user isn't already on a public auth page, 
        // AND the request wasn't just the initial background check.
        if (
          window.location.pathname !== '/login' && 
          window.location.pathname !== '/register' &&
          originalRequest.url !== '/auth/me'
        ) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
