const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost/CampusFlow/backend/api';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const config = {
    credentials: 'include', // Required for PHP sessions across localhost:5173 -> localhost
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const result = await response.json();

  if (!response.ok || !result.success) {
    const error = new Error(result.message || 'Something went wrong');
    error.status = response.status;
    error.errors = result.errors || null;
    throw error;
  }

  return result;
}
