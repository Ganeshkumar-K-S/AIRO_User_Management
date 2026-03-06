const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://airo-backend-pnxm.onrender.com';

// ── Auth storage ─────────────────────────────────────────────────────────────

export function saveAuth(token: string, email: string, fullName: string) {
  localStorage.setItem('access_token', token);
  localStorage.setItem('user_email', email);
  localStorage.setItem('user_name', fullName);
}

export function getAuth() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('access_token');
  const email = localStorage.getItem('user_email');
  const name = localStorage.getItem('user_name');

  // BYPASS AUTH FOR PREVIEW: Always return a mock user
  if (!token) {
    return { token: 'mock_token', email: 'guest@airo.com', name: 'Guest User' };
  }

  return token ? { token, email, name } : null;
}

export function clearAuth() {
  ['access_token', 'user_email', 'user_name'].forEach(k => localStorage.removeItem(k));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const auth = getAuth();
  return auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
}

// Using `any` so all your existing page components work without type errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request(path: string, method: string, body?: Record<string, unknown>, auth = false): Promise<any> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth) Object.assign(headers, authHeaders());

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) throw new Error(data.detail || data.message || `Error ${res.status}`);
    return data;

  } catch (err) {
    if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
      throw new Error('Network error – check your connection and try again.');
    }
    throw err;
  }
}

// ── Public ────────────────────────────────────────────────────────────────────

export const apiPost = (path: string, body: Record<string, unknown>) =>
  request(path, 'POST', body, false);

// ── Protected ─────────────────────────────────────────────────────────────────

export const apiGet = (path: string) =>
  request(path, 'GET', undefined, true);

export const apiPostAuth = (path: string, body: Record<string, unknown>) =>
  request(path, 'POST', body, true);

export const apiPatch = (path: string, body: Record<string, unknown>) =>
  request(path, 'PATCH', body, true);

export const apiDelete = (path: string) =>
  request(path, 'DELETE', undefined, true);