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

// ── Auth ──────────────────────────────────────────────────────
export function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ── Admin — Routes ────────────────────────────────────────────
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

// ── Admin — Users ─────────────────────────────────────────────
export function getUsers(role) {
  const query = role ? `?role=${role}` : '';
  return request(`/admin/users${query}`);
}

export function createUser(payload) {
  return request('/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteUser(id) {
  return request(`/admin/users/${id}`, { method: 'DELETE' });
}

// ── Admin — Buses ─────────────────────────────────────────────
export function getBuses() {
  return request('/admin/buses');
}

export function createBus(payload) {
  return request('/admin/buses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateBus(id, payload) {
  return request(`/admin/buses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteBus(id) {
  return request(`/admin/buses/${id}`, { method: 'DELETE' });
}

// ── Admin — Riders ────────────────────────────────────────────
export function getRiders() {
  return request('/admin/riders');
}

export function createRider(payload) {
  return request('/admin/riders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteRider(id) {
  return request(`/admin/riders/${id}`, { method: 'DELETE' });
}

// ── Driver ────────────────────────────────────────────────────
export function getDriverInfo() {
  return request('/driver/me');
}

export function startTrip() {
  return request('/driver/trip/start', { method: 'POST' });
}

export function endTrip() {
  return request('/driver/trip/end', { method: 'POST' });
}

export function sendLocation(latitude, longitude, speedKmh) {
  return request('/driver/location', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude, speed_kmh: speedKmh }),
  });
}

// ── Public (no auth) ──────────────────────────────────────────
export function getPublicRoutes() {
  return request('/routes');
}

export function getRouteLive(routeId) {
  return request(`/routes/${routeId}/live`);
}

export { request };