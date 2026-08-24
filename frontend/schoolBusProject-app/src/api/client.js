const BASE_URL = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('sbt_token');

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

export function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getRoutes() {
  return request('/admin/routes');
}

export function createRoute(payload) {
  return request('/admin/routes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteRoute(id) {
  return request(`/admin/routes/${id}`, { method: 'DELETE' });
}

export { request };