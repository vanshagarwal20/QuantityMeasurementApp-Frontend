import api from './axiosConfig';

const BASE = '/api/v1/quantities';

export const qmaApi = {
    add: (data) => api.post(`${BASE}/add`, data),
    subtract: (data) => api.post(`${BASE}/subtract`, data),
    multiply: (data) => api.post(`${BASE}/multiply`, data),
    divide: (data) => api.post(`${BASE}/divide`, data),
    compare: (data) => api.post(`${BASE}/compare`, data),
    convert: (data) => api.post(`${BASE}/convert`, data),

    historyByOperation: (op) =>
        api.get(`${BASE}/history/operation/${op}`),
    historyByType: (type) =>
        api.get(`${BASE}/history/type/${type}`),
    count: (op) => api.get(`${BASE}/count/${op}`),
};
