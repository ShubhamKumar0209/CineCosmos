import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
        const refreshUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/auth/refresh` : '/api/auth/refresh';
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) throw new Error('No refresh token available');

        const { data } = await axios.post(refreshUrl, { refreshToken }, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Save new tokens
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);

        // Update original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        
        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token failed/expired
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
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
