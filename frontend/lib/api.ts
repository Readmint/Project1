// frontend/lib/api.ts
// Production-ready API helper for calling backend JSON endpoints.

export const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api").replace(/\/+$/, "");

type Nullable<T> = T | null;

export class ApiError extends Error {
  public status: number;
  public data: any;
  public url: string;

  constructor(message: string, status: number, data: any, url: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.url = url;
  }

  // Helper to get detailed error message
  getDetailedMessage(): string {
    if (this.data?.errors) {
      return this.data.errors.map((err: any) => err.msg || err).join(', ');
    }
    if (this.data?.message) {
      return this.data.message;
    }
    return this.message;
  }
}

async function parseResponse(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

function buildUrl(path: string) {
  if (!path) return API_BASE;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

/**
 * Enhanced POST JSON helper with better error details
 * @param path - path under API base, e.g. "/auth/login" or "auth/login"
 * @param body - object to stringify
 * @param token - optional Bearer token
 */
export async function postJSON(path: string, body: any, token?: string) {
  const url = buildUrl(path);
  let res: Response;

  // Enhanced logging for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`API POST: ${url}`, { body: { ...body, idToken: body?.idToken ? '[HIDDEN]' : undefined } });
  }

  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body ?? {}),
      credentials: "include",
    });
  } catch (err: any) {
    // network-level failure (DNS, CORS blocked, offline, etc.)
    const error = new ApiError("Network request failed", 0, { error: String(err?.message ?? err) }, url);
    console.error('Network error:', error);
    throw error;
  }

  const data = await parseResponse(res);

  if (!res.ok) {
    const message = (data && data.message) ? data.message : `HTTP ${res.status}`;
    const error = new ApiError(message, res.status, data, url);
    
    // Enhanced error logging
    console.error(`API Error ${res.status}: ${url}`, {
      status: res.status,
      message: error.getDetailedMessage(),
      data: data
    });
    
    throw error;
  }

  return data;
}

/**
 * GET JSON helper
 * @param path - path under API base
 * @param token - optional Bearer token
 */
export async function getJSON(path: string, token?: string) {
  const url = buildUrl(path);
  let res: Response;

  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });
  } catch (err: any) {
    const error = new ApiError("Network request failed", 0, { error: String(err?.message ?? err) }, url);
    console.error('Network error:', error);
    throw error;
  }

  const data = await parseResponse(res);

  if (!res.ok) {
    const message = (data && data.message) ? data.message : `HTTP ${res.status}`;
    const error = new ApiError(message, res.status, data, url);
    console.error(`API Error ${res.status}: ${url}`, error.getDetailedMessage());
    throw error;
  }

  return data;
}

/**
 * Specialized OAuth helper for better error handling
 */
export async function postOAuth(idToken: string, provider: string = 'google') {
  return postJSON('/auth/oauth', { idToken, provider });
}