// frontend/lib/api.ts  (replace existing file content or merge changes)
export const API_BASE =
  process.env.NODE_ENV === 'production'
    ? "https://us-central1-readmint-fe3c3.cloudfunctions.net/api/api"
    : (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api").replace(/\/+$/, "");

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

  getDetailedMessage(): string {
    if (this.data?.errors) {
      return this.data.errors.map((err: any) => err.msg || err).join(', ');
    }
    if (this.data?.error) {
      return this.data.error;
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
 * Read token from localStorage safely (only in browser).
 * Accepts both 'ACCESS_TOKEN' and legacy 'token' keys.
 */
function readTokenFromStorage(): string | undefined {
  try {
    if (typeof window === "undefined") return undefined;
    return localStorage.getItem("ACCESS_TOKEN") || localStorage.getItem("token") || undefined;
  } catch (err) {
    // localStorage may throw in some environments; fail silently
    console.warn("readTokenFromStorage failed", err);
    return undefined;
  }
}

/**
 * Enhanced POST JSON helper with better error details
 * @param path - path under API base, e.g. "/auth/login" or "auth/login"
 * @param body - object to stringify
 * @param token - optional Bearer token override
 */
export async function postJSON(path: string, body: any, token?: string) {
  const url = buildUrl(path);
  let res: Response;

  // Decide which token to use: explicit param > localStorage > none
  const tokenToUse = token ?? readTokenFromStorage();

  if (process.env.NODE_ENV === 'development') {
    console.log(`API POST: ${url}`, { body: { ...body, idToken: body?.idToken ? '[HIDDEN]' : undefined }, tokenProvided: !!tokenToUse });
  }

  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
      },
      body: JSON.stringify(body ?? {}),
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
 * Enhanced PUT JSON helper
 */
export async function putJSON(path: string, body: any, token?: string) {
  const url = buildUrl(path);
  let res: Response;

  const tokenToUse = token ?? readTokenFromStorage();

  if (process.env.NODE_ENV === 'development') {
    console.log(`API PUT: ${url}`, { body: { ...body }, tokenProvided: !!tokenToUse });
  }

  try {
    res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
      },
      body: JSON.stringify(body ?? {}),
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
 * @param token - optional Bearer token override
 */
export async function getJSON(path: string, token?: string) {
  const url = buildUrl(path);
  let res: Response;

  const tokenToUse = token ?? readTokenFromStorage();

  if (process.env.NODE_ENV === 'development') {
    console.log(`API GET: ${url}`, { tokenProvided: !!tokenToUse });
  }

  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
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

/**
 * PATCH JSON helper
 */
export async function patchJSON(path: string, body: any, token?: string) {
  const url = buildUrl(path);
  let res: Response;

  const tokenToUse = token ?? readTokenFromStorage();

  if (process.env.NODE_ENV === 'development') {
    console.log(`API PATCH: ${url}`, { body: { ...body }, tokenProvided: !!tokenToUse });
  }

  try {
    res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
      },
      body: JSON.stringify(body ?? {}),
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
 * DELETE JSON helper
 */
export async function deleteJSON(path: string, token?: string) {
  const url = buildUrl(path);
  let res: Response;

  const tokenToUse = token ?? readTokenFromStorage();

  if (process.env.NODE_ENV === 'development') {
    console.log(`API DELETE: ${url}`, { tokenProvided: !!tokenToUse });
  }

  try {
    res = await fetch(url, {
      method: "DELETE",
      headers: {
        ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
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
    console.error(`API Error ${res.status}: ${url}`, {
      status: res.status,
      message: error.getDetailedMessage(),
      data: data
    });
    throw error;
  }

  return data;
}
