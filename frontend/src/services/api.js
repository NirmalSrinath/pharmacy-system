import axios from 'axios';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('pharmacy_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch {}
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('pharmacy_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) => api.post('/api/auth/login', { username, password }),
  register: (data) => api.post('/api/auth/register', data),
  getUsers: () => api.get('/api/auth/users'),
  updateUser: (id, data) => api.put(`/api/auth/users/${id}`, data),
  toggleUser: (id) => api.put(`/api/auth/users/${id}/toggle`),
  deleteUser: (id) => api.delete(`/api/auth/users/${id}`),
};

export const medicineAPI = {
  getAll: (params) => api.get('/api/medicines', { params }),
  getById: (id) => api.get(`/api/medicines/${id}`),
  create: (data) => api.post('/api/medicines', data),
  update: (id, data) => api.put(`/api/medicines/${id}`, data),
  delete: (id) => api.delete(`/api/medicines/${id}`),
  getExpiryAlerts: (params) => api.get('/api/medicines/expiry-alerts', { params }),
  getLowStock: (params) => api.get('/api/medicines/low-stock', { params }),
  search: (query) => api.get('/api/medicines/search', { params: { q: query } }),
  findExact: (params) => api.get('/api/medicines/find-exact', { params }),
  importCSV: (formData) => api.post('/api/medicines/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  exportMedicines: (params) => api.get('/api/medicines/export', { params, responseType: 'blob' }),
};

export const salesAPI = {
  getAll: (params) => api.get('/api/sales', { params }),
  getById: (id) => api.get(`/api/sales/${id}`),
  create: (data) => api.post('/api/sales', data),
  exportSales: (params) => api.get('/api/sales/export', { params, responseType: 'blob' }),
};

export const purchaseAPI = {
  getAll: (params) => api.get('/api/purchases', { params }),
  create: (data) => api.post('/api/purchases', data),
  exportPurchases: (params) => api.get('/api/purchases/export', { params, responseType: 'blob' }),
};

export const returnsAPI = {
  getAll: (params) => api.get('/api/returns', { params }),
  create: (data) => api.post('/api/returns', data),
};

export const wardPatientAPI = {
  getAll: (params) => api.get('/api/ward-patients', { params }),
  getById: (id) => api.get(`/api/ward-patients/${id}`),
  create: (data) => api.post('/api/ward-patients', data),
  update: (id, data) => api.put(`/api/ward-patients/${id}`, data),
  addItem: (id, data) => api.post(`/api/ward-patients/${id}/items`, data),
  removeItem: (id, itemId) => api.delete(`/api/ward-patients/${id}/items/${itemId}`),
  updateDiscount: (id, discount) => api.put(`/api/ward-patients/${id}/discount`, { discount }),
  finalize: (id) => api.post(`/api/ward-patients/${id}/finalize`),
  delete: (id) => api.delete(`/api/ward-patients/${id}`),
};

export const reportsAPI = {
  getDaily: (params) => api.get('/api/reports/daily', { params }),
  getWeekly: (params) => api.get('/api/reports/weekly', { params }),
  getMonthly: (params) => api.get('/api/reports/monthly', { params }),
  getYearly: (params) => api.get('/api/reports/yearly', { params }),
};

export const dashboardAPI = {
  getDashboard: () => api.get('/api/dashboard'),
};

export const backupAPI = {
  getAll: () => api.get('/api/backup'),
  getRecent: (limit = 10) => api.get('/api/backup/recent', { params: { limit } }),
  create: () => api.post('/api/backup/create'),
  download: (id) => api.get(`/api/backup/download/${id}`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/api/backup/${id}`),
};

export const doctorAPI = {
  getAll: () => api.get('/api/doctors'),
  getActive: () => api.get('/api/doctors/active'),
  getById: (id) => api.get(`/api/doctors/${id}`),
  search: (name) => api.get('/api/doctors/search', { params: { name } }),
  create: (data) => api.post('/api/doctors', data),
  update: (id, data) => api.put(`/api/doctors/${id}`, data),
  toggle: (id) => api.put(`/api/doctors/${id}/toggle`),
  delete: (id) => api.delete(`/api/doctors/${id}`),
  verify: (id, passcode) => api.post('/api/doctors/verify', { id, passcode }),
};

export const staffAPI = {
  getAll: () => api.get('/api/staff'),
  getActive: () => api.get('/api/staff/active'),
  getById: (id) => api.get(`/api/staff/${id}`),
  search: (name) => api.get('/api/staff/search', { params: { name } }),
  create: (data) => api.post('/api/staff', data),
  update: (id, data) => api.put(`/api/staff/${id}`, data),
  toggle: (id) => api.put(`/api/staff/${id}/toggle`),
  delete: (id) => api.delete(`/api/staff/${id}`),
  verify: (id, passcode) => api.post('/api/staff/verify', { id, passcode }),
};

export const supplierAPI = {
  getAll: () => api.get('/api/suppliers'),
  getActive: () => api.get('/api/suppliers/active'),
  getById: (id) => api.get(`/api/suppliers/${id}`),
  search: (name) => api.get('/api/suppliers/search', { params: { name } }),
  create: (data) => api.post('/api/suppliers', data),
  update: (id, data) => api.put(`/api/suppliers/${id}`, data),
  toggle: (id) => api.put(`/api/suppliers/${id}/toggle`),
  delete: (id) => api.delete(`/api/suppliers/${id}`),
};

export default api;
