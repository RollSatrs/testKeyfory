// Centralized API helper to use Vite proxy (/api), attach JWT, and handle 401s consistently

export function getToken() {
  try {
    return localStorage.getItem('admin_token');
  } catch {
    return null;
  }
}

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('/api') ? path : `/api${path}`;

  const headers = {
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const init = { ...options, headers };
  // Auto set JSON header if a non-FormData body is provided and no explicit content-type
  const hasBody = typeof init.body !== 'undefined' && init.body !== null;
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const hasContentType = Object.keys(headers).some(k => k.toLowerCase() === 'content-type');
  if (hasBody && !isFormData && !hasContentType) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, init);

  // Best-effort to parse JSON; some endpoints might not return JSON on error
  let data = null;
  try {
    data = await res.clone().json();
  } catch {
    // ignore json parse failures
  }

  if (res.status === 401) {
    // Invalidate token on unauthorized
    try { localStorage.removeItem('admin_token'); } catch {}
    const err = new Error((data && (data.error || data.message)) || 'Unauthorized');
    err.status = 401;
    err.data = data;
    throw err;
  }

  if (!res.ok) {
    const err = new Error((data && (data.error || data.message)) || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Создаем объект API для удобства использования
export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => apiFetch(path, { method: 'DELETE' }),
  patch: (path, body) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) })
};

export default apiFetch;
