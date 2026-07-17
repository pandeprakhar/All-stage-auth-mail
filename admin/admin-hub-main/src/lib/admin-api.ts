/**
 * Admin API client.
 *
 * Base URL is read from Vite env var `VITE_ADMIN_API_URL` (set in `.env`).
 * All requests attach the bearer token stored under `allstag_admin_token`.
 *
 * Response envelope expected from backend:
 *   { success: boolean, data?: T, message?: string, errors?: any }
 */

const TOKEN_KEY = "allstag_admin_token";
const REMEMBER_KEY = "allstag_admin_remember";

export const ADMIN_API_BASE: string =
  (import.meta.env.VITE_ADMIN_API_URL as string | undefined) ??
  "http://localhost:8080/api/admin";

/** Auth endpoints live at /api/auth, not /api/admin. */
export const AUTH_API_BASE: string =
  ADMIN_API_BASE.replace(/\/api\/admin\/?$/, "/api/auth");

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem(TOKEN_KEY) ??
    window.sessionStorage.getItem(TOKEN_KEY)
  );
}

export function setAdminToken(token: string, remember: boolean): void {
  if (typeof window === "undefined") return;
  clearAdminToken();
  if (remember) {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(REMEMBER_KEY, "1");
  } else {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearAdminToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REMEMBER_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
}

export class AdminApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export async function adminFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {

  const url = path.startsWith("http") ? path : `${ADMIN_API_BASE}${path}`;
  console.log("ADMIN_API_BASE =", ADMIN_API_BASE);
  console.log("REQUEST URL =", url); const token = getAdminToken();

  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, credentials: "include" });
  } catch (err) {
    throw new AdminApiError(
      "Network error — could not reach admin API. Check VITE_ADMIN_API_URL.",
      0,
      err,
    );
  }

  let payload: ApiResponse<T> | null = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text) as ApiResponse<T>;
    } catch {
      /* non-JSON — leave null */
    }
  }

  if (!res.ok) {
    if (res.status === 401) clearAdminToken();
    throw new AdminApiError(
      payload?.message || `Request failed (${res.status})`,
      res.status,
      payload ?? text,
    );
  }

  if (payload && "data" in payload) return payload.data as T;
  return payload as unknown as T;
}

export const adminApi = {
  get: <T = unknown>(p: string) => adminFetch<T>(p, { method: "GET" }),
  post: <T = unknown>(p: string, body?: unknown) =>
    adminFetch<T>(p, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  put: <T = unknown>(p: string, body?: unknown) =>
    adminFetch<T>(p, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  patch: <T = unknown>(p: string, body?: unknown) =>
    adminFetch<T>(p, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  delete: <T = unknown>(p: string) => adminFetch<T>(p, { method: "DELETE" }),
};
