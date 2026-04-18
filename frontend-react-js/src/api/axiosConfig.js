import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    headers: { 'Content-Type': 'application/json' },
    timeout: 60000, // 60 seconds — Render free tier cold start can take ~1 min
});

// Attach JWT on every request automatically
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('qm_jwt_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle 401 — clear token and redirect to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const session = localStorage.getItem('qm_auth_session');

            if (session) {
                localStorage.removeItem('qm_jwt_token');
                localStorage.removeItem('qm_auth_session');
                window.location.href = '/login';
            } else {
                console.warn("401 received but user not logged in — ignoring");
            }
        }
        return Promise.reject(error);
    }
);

export default api;
