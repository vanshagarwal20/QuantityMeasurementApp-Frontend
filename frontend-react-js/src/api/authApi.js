import api from './axiosConfig';

export const authApi = {
    signup: (data) => api.post('/api/auth/signup', data),
    login: (data) => api.post('/api/auth/login', data),
    validate: (token) => api.get(`/api/auth/validate?token=${token}`),
};
