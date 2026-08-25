import axios from 'axios';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pharmatrace_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 — clear session and redirect to login (no refresh endpoint in backend)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pharmatrace_token');
      localStorage.removeItem('pharmatrace_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ===== AUTH =====
export const authApi = {
  register: (data: RegisterInput) => api.post('/auth/register', data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
};

// ===== MEDICINES =====
export const medicineApi = {
  list: () => api.get('/medicines'),
  create: (data: object) => api.post('/medicines', data),
  flag: (batchId: string, reason: string) => api.post(`/medicines/${batchId}/flag`, { reason }),
  history: (batchId: string) => api.get(`/medicines/${batchId}/history`),
};

// ===== BATCHES =====
export const batchApi = {
  list: () => api.get('/batches'),
  get: (id: string) => api.get(`/batches/${id}`),
  create: (data: object) => api.post('/batches', data),
  recall: (id: string, reason: string) => api.post(`/batches/${id}/recall`, { reason }),
};

// ===== SHIPMENTS =====
export const shipmentApi = {
  list: () => api.get('/shipments'),
  transfer: (data: { batchId: string; fromEntityId: string; toEntityId: string }) =>
    api.post('/shipments/transfer', data),
  receive: (shipmentId: string) => api.post(`/shipments/${shipmentId}/receive`),
};

// ===== VERIFY =====
export const verifyApi = {
  scan: (payload: string, geoLat?: number, geoLng?: number) =>
    api.post('/verify/scan', { qrPayload: payload, geoLat, geoLng }),
};

// ===== ENTITIES =====
// Loads approved supply-chain entities for transfer-modal dropdowns
export const entityApi = {
  list: (role: 'DISTRIBUTOR' | 'WHOLESALER' | 'PHARMACY') =>
    api.get(`/entities?role=${role}`),
  me: () => api.get('/entities/me'),
};

// ===== ADMIN =====
export const adminApi = {
  pendingUsers: () => api.get('/admin/users/pending'),
  approveUser: (userId: string) => api.post(`/admin/users/${userId}/approve`),
  rejectUser: (userId: string) => api.post(`/admin/users/${userId}/reject`),
  auditLogs: () => api.get('/admin/audit-logs'),
  securityEvents: () => api.get('/admin/security-events'),
  recomputeAI: () => api.post('/admin/ai/recompute-scores'),
  recalls: () => api.get('/admin/recalls'),
  notifications: (limit?: number) =>
    api.get(`/admin/notifications${limit ? `?limit=${limit}` : ''}`),
};

// ===== TYPES =====
export interface RegisterInput {
  email: string;
  password: string;
  role: 'MANUFACTURER' | 'DISTRIBUTOR' | 'WHOLESALER' | 'PHARMACY' | 'INSPECTOR';
  orgName?: string;
  licenseNo?: string;
}

