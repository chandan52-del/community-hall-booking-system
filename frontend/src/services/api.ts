import axios, { AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const TOKEN_KEY = 'sabha-auth-token';

// Automatically inject JWT Bearer token into Authorization header
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses for unified error parsing
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      // If token expired, clear local storage token
      const errCode = error.response.data?.error?.code;
      if (errCode === 'TOKEN_EXPIRED' || errCode === 'INVALID_TOKEN') {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (data: { email: string; password: string; name: string; phone: string; organization?: string }) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  updateMe: async (data: { name?: string; phone?: string; organization?: string }) => {
    const res = await apiClient.put('/auth/me', data);
    return res.data;
  },
};

export const hallsApi = {
  getAll: async (params?: Record<string, any>) => {
    const res = await apiClient.get('/halls', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/halls/${id}`);
    return res.data;
  },
  checkAvailability: async (id: string, date: string) => {
    const res = await apiClient.get(`/halls/${id}/availability`, { params: { date } });
    return res.data;
  },
  getAmenities: async () => {
    const res = await apiClient.get('/halls/amenities');
    return res.data;
  },
};

export const bookingsApi = {
  create: async (data: any) => {
    const res = await apiClient.post('/bookings', data);
    return res.data;
  },
  getMy: async () => {
    const res = await apiClient.get('/bookings/my');
    return res.data;
  },
  getAll: async (params?: Record<string, any>) => {
    const res = await apiClient.get('/bookings', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/bookings/${id}`);
    return res.data;
  },
  approve: async (id: string) => {
    const res = await apiClient.patch(`/bookings/${id}/approve`);
    return res.data;
  },
  reject: async (id: string, reason: string) => {
    const res = await apiClient.patch(`/bookings/${id}/reject`, { reason });
    return res.data;
  },
  cancel: async (id: string) => {
    const res = await apiClient.patch(`/bookings/${id}/cancel`);
    return res.data;
  },
};

export const maintenanceApi = {
  getAll: async (params?: Record<string, any>) => {
    const res = await apiClient.get('/maintenance', { params });
    return res.data;
  },
  create: async (data: { hallId: string; startDate: string; endDate: string; description: string }) => {
    const res = await apiClient.post('/maintenance', data);
    return res.data;
  },
  updateStatus: async (id: string, status: string) => {
    const res = await apiClient.patch(`/maintenance/${id}/status`, { status });
    return res.data;
  },
  cancel: async (id: string) => {
    const res = await apiClient.patch(`/maintenance/${id}/cancel`);
    return res.data;
  },
};

export const adminApi = {
  getStats: async () => {
    const res = await apiClient.get('/admin/stats');
    return res.data;
  },
  getCalendarFeed: async (params?: Record<string, any>) => {
    const res = await apiClient.get('/admin/calendar', { params });
    return res.data;
  },
};

export const healthApi = {
  getHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },
  getReadiness: async () => {
    const res = await apiClient.get('/health/ready');
    return res.data;
  },
};
