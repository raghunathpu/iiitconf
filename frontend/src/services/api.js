import axios from 'axios';

const API = axios.create({ baseURL: (import.meta.env.VITE_API_URL || '') + '/api' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);

// Papers
export const getPapers = (params) => API.get('/papers', { params });
export const getPaper = (id) => API.get(`/papers/${id}`);
export const submitPaper = (formData) => API.post('/papers', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const downloadPaper = (id) => API.get(`/papers/${id}/download`, { responseType: 'blob' });
export const updatePaperStatus = (id, data) => API.put(`/papers/${id}/status`, data);
export const revisePaper = (id, formData) => API.post(`/papers/${id}/revise`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const requestRevision = (id, data) => API.post(`/papers/${id}/revision-request`, data);
export const getTracks = () => API.get('/papers/tracks/all');

// Reviews
export const getPaperReviews = (paperId) => API.get(`/reviews/paper/${paperId}`);
export const getMyReview = (paperId) => API.get(`/reviews/my/${paperId}`);
export const submitReview = (data) => API.post('/reviews', data);
export const getReviewComparison = (paperId) => API.get(`/reviews/comparison/${paperId}`);

// Assignments
export const getAvailableReviewers = (paperId) => API.get(`/assignments/reviewers/${paperId}`);
export const assignReviewer = (data) => API.post('/assignments', data);
export const removeAssignment = (id) => API.delete(`/assignments/${id}`);
export const declineAssignment = (id) => API.put(`/assignments/${id}/decline`);

// Notifications
export const getNotifications = () => API.get('/notifications');
export const markRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllRead = () => API.put('/notifications/read-all/all');

// Admin
export const getAnalytics = () => API.get('/admin/analytics');
export const getUsers = (params) => API.get('/admin/users', { params });
export const toggleUser = (id) => API.put(`/admin/users/${id}/toggle`);
export const changeRole = (id, role) => API.put(`/admin/users/${id}/role`, { role });
export const getAuditLogs = () => API.get('/admin/audit-logs');
export const addConflict = (data) => API.post('/admin/conflicts', data);
export const createTrack = (data) => API.post('/admin/tracks', data);

export default API;
