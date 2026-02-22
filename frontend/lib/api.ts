const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  const name  = localStorage.getItem('user_name');
  return token ? { token, email, name } : null;
}

export function clearAuth() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_name');
}

// ── Base fetch helpers ───────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const auth = getAuth();
  return auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
}

/** POST — public (no JWT needed, e.g. /auth/*) */
export async function apiPost(
  path: string,
  body: Record<string, unknown>
) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Something went wrong');
  return data;
}

/** GET — protected (JWT sent automatically) */
export async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Something went wrong');
  return data;
}

/** POST — protected (JWT sent automatically) */
export async function apiPostAuth(
  path: string,
  body: Record<string, unknown>
) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Something went wrong');
  return data;
}

/** PATCH — protected */
export async function apiPatch(
  path: string,
  body: Record<string, unknown>
) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Something went wrong');
  return data;
}

/** DELETE — protected */
export async function apiDelete(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Something went wrong');
  return data;
}
