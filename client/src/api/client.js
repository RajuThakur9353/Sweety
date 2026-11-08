const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getAuthToken() {
  return localStorage.getItem('sweety_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('sweety_token', token);
  } else {
    localStorage.removeItem('sweety_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.field = data.field;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  getProfile: () => request('/auth/me'),

  getPatients: () => request('/auth/patients'),

  // Readings
  getReadings: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.patientId) query.append('patientId', params.patientId);

    const qs = query.toString();
    return request(`/readings${qs ? `?${qs}` : ''}`);
  },

  createReading: (readingData) => request('/readings', {
    method: 'POST',
    body: JSON.stringify(readingData),
  }),

  updateReading: (id, readingData) => request(`/readings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(readingData),
  }),

  deleteReading: (id) => request(`/readings/${id}`, {
    method: 'DELETE',
  }),

  // Reports
  getReports: (date, patientId = null) => {
    const query = new URLSearchParams();
    if (date) query.append('date', date);
    if (patientId) query.append('patientId', patientId);
    return request(`/reports?${query.toString()}`);
  },
};
