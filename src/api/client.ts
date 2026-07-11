export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const TOKEN_KEY = 'examflow_token';

// "Remember me" controls persistence: localStorage survives closing the browser,
// sessionStorage clears when the tab/browser closes. getToken checks both so an
// already-restored session keeps working regardless of which one it landed in.
export const getToken = (): string | null =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

export const setToken = (token: string, remember: boolean = true) => {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === 'string') {
        // Plain string detail — our own HTTPException(detail="...") calls.
        detail = body.detail;
      } else if (Array.isArray(body.detail) && body.detail.length > 0) {
        // FastAPI/Pydantic validation error shape: [{ msg, loc, ... }, ...].
        // Surface the first field error as a readable sentence instead of "[object Object]".
        detail = body.detail.map((e: { msg?: string }) => e.msg).filter(Boolean).join(' ') || detail;
      }
    } catch {
      // ignore body parse failure
    }
    if (res.status === 401) {
      clearToken();
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
