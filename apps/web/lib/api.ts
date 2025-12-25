import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';
import { useAuthStore } from './store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Try store token first (available immediately after login/rehydration)
    const storeToken = useAuthStore.getState().accessToken;

    if (storeToken) {
      config.headers.Authorization = `Bearer ${storeToken}`;
      return config;
    }

    // Fallback to Supabase session (for token refresh scenarios)
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
      // Sync token to store
      useAuthStore.setState({ accessToken: session.access_token });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Skip token refresh for auth endpoints (login, register, etc.)
    const isAuthEndpoint = originalRequest.url?.startsWith('/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // Try to refresh the session via Supabase
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !session) {
          throw new Error('Session refresh failed');
        }

        // Update token in store
        useAuthStore.setState({ accessToken: session.access_token });

        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Sign out and redirect to login
        await supabase.auth.signOut();
        useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false });
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API - simplified since Supabase handles most auth
export const authApi = {
  register: (data: FormData) =>
    api.post('/auth/register', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  checkEmail: (email: string) =>
    api.post<{ available: boolean }>('/auth/check-email', { email }),
  logout: () => api.post('/auth/logout'),
};

// Requests API
export const requestsApi = {
  create: (data: {
    description: string;
    budget: number;
    currency?: string;
    contactName: string;
    phone: string;
    email?: string;
    preferredContact?: string;
  }) => api.post('/requests', data),
};

// Lawyer API
export const lawyerApi = {
  getProfile: () => api.get('/lawyer/profile'),
  updateProfile: (data: { fullName?: string; phone?: string }) =>
    api.patch('/lawyer/profile', data),
  updateDocuments: (data: FormData) =>
    api.post('/lawyer/documents', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getRequests: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/lawyer/requests', { params }),
  getRequestDetails: (id: string) =>
    api.get(`/lawyer/requests/${id}`),
  takeRequest: (id: string) =>
    api.post(`/lawyer/requests/${id}/take`),
  releaseRequest: (id: string) =>
    api.post(`/lawyer/requests/${id}/release`),
  getMyRequests: (params?: { page?: number; limit?: number }) =>
    api.get('/lawyer/my-requests', { params }),
};

// Admin API
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getLawyers: (params?: {
    status?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/admin/lawyers', { params }),
  getLawyerDetails: (id: string) => api.get(`/admin/lawyers/${id}`),
  approveLawyer: (id: string) => api.patch(`/admin/lawyers/${id}/approve`),
  rejectLawyer: (id: string, reason: string) =>
    api.patch(`/admin/lawyers/${id}/reject`, { reason }),
  getRequests: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/admin/requests', { params }),
  getRequestDetails: (id: string) => api.get(`/admin/requests/${id}`),
  updateRequestStatus: (id: string, status: string) =>
    api.patch(`/admin/requests/${id}`, { status }),
  deleteRequest: (id: string) => api.delete(`/admin/requests/${id}`),
};

export default api;
