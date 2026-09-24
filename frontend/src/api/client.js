// In local dev, Vite proxies '/api' and '/uploads' to the backend on :5000, so
// a relative path works. In production on Render, frontend and backend live on
// different origins — set VITE_API_BASE_URL at build time to the backend's URL
// (e.g. https://uptown-backend.onrender.com) and requests become absolute.
const API_ORIGIN = import.meta.env.VITE_API_BASE_URL || '';
const BASE = `${API_ORIGIN}/api`;

function getToken() {
  return localStorage.getItem('uptown_token');
}const API_ORIGIN = import.meta.env.VITE_API_BASE_URL || '';
const BASE = "${API_ORIGIN}/api";

function getToken() {
  return localStorage.getItem("uptown_token");
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.error || "Something went wrong. Please try again.");
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: () => request("/auth/me", { auth: true }),
  updateProfile: (payload) => request("/auth/me", { method: "PUT", body: payload, auth: true }),

  getMenu: () => request("/menu"),

  createOrder: (payload) => request("/orders", { method: "POST", body: payload, auth: true }),
  getOrders: () => request("/orders", { auth: true }),
  getOrder: (id) => request(`/orders/${id}`, { auth: true }),

  stkPush: (payload) => request("/mpesa/stkpush", { method: "POST", body: payload, auth: true }),
  paymentStatus: (orderId) => request(`/mpesa/status/${orderId}`, { auth: true }),

  whatsappLink: (orderId) => request(`/whatsapp/link/${orderId}`, { auth: true }),

  premiumStatus: () => request("/premium/status", { auth: true }),
  premiumStkPush: (payload) => request("/premium/stkpush", { method: "POST", body: payload, auth: true }),
  premiumPaymentStatus: (paymentId) => request(`/premium/payment-status/${paymentId}`, { auth: true }),

  getAllMenuItems: () => request("/menu/all", { auth: true }),
  createMenuItem: (payload) => request("/menu", { method: "POST", body: payload, auth: true }),
  updateMenuItem: (id, payload) => request(`/menu/${id}`, { method: "PUT", body: payload, auth: true }),
  deleteMenuItem: (id) => request(`/menu/${id}`, { method: "DELETE", auth: true })
};

export { getToken };


// Resolves a server-relative path (e.g. an uploaded image at /uploads/menu/x.jpg)
// to an absolute URL when the API lives on a different origin than the frontend.
export function resolveAssetUrl(relativePath) {
  if (!relativePath) return relativePath;
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  return `${API_ORIGIN}${relativePath}`;
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

async function uploadFile(path, file) {
  const token = getToken();
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }
  if (!res.ok) {
    throw new Error(data?.error || `Upload failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),
  updateProfile: (payload) => request('/auth/me', { method: 'PATCH', body: payload }),
  getMenu: () => request('/menu', { auth: false }),
  createOrder: (payload) => request('/orders', { method: 'POST', body: payload }),
  listOrders: () => request('/orders'),
  getOrder: (id) => request(`/orders/${id}`),
  getConfig: () => request('/config', { auth: false }),

  // Premium accounts
  getPremiumStatus: () => request('/premium/status'),
  premiumStkPush: (payload) => request('/premium/stkpush', { method: 'POST', body: payload }),
  premiumPaymentStatus: (paymentId) => request(`/premium/payment-status/${paymentId}`),

  // Admin
  listMenuAdmin: () => request('/menu/admin/all'),
  updateMenuItem: (id, payload) => request(`/menu/${id}`, { method: 'PATCH', body: payload }),
    listAllOrders: () => request('/orders/admin/all'),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  createMenuItem: (payload) => request('/menu', { method: 'POST', body: payload }),
  uploadMenuImage: (id, file) => uploadFile(`/menu/${id}/image`, file),
};

export { getToken };
