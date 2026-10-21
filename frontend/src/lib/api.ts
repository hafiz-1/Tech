/**
 * Single API client for the TechCart backend.
 *
 * The backend authenticates with httpOnly cookies (auth_token / refresh_token),
 * so every request sends credentials. On a 401 the client attempts exactly one
 * token refresh (shared across parallel calls) and retries the original
 * request once. If refresh fails it broadcasts `techcart:session-expired` so
 * the auth provider can send the user back to login.
 */

export const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:5000";

export const SESSION_EXPIRED_EVENT = "techcart:session-expired";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Set false to skip the refresh-and-retry behavior (used by auth calls). */
  retryOn401?: boolean;
};

async function rawFetch(path: string, options: RequestOptions): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

let refreshPromise: Promise<boolean> | null = null;

/** One in-flight refresh shared by all parallel requests. */
function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = rawFetch("/api/auth/refresh", { method: "POST" })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function toApiError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  let code: string | undefined;
  let details: unknown;
  try {
    const body = await res.json();
    details = body;
    if (typeof body?.message === "string") message = body.message;
    else if (typeof body?.error === "string") message = body.error;
    else if (Array.isArray(body?.errors) && body.errors.length > 0) {
      message = body.errors
        .map((e: { message?: string } | string) => (typeof e === "string" ? e : e.message))
        .filter(Boolean)
        .join(", ");
    }
    if (typeof body?.code === "string") code = body.code;
  } catch {
    // non-JSON error body; keep the generic message
  }
  return new ApiError(res.status, message, code, details);
}

export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await rawFetch(path, options);

  // Until the backend provides a specific expired-token code, a plain 401 is
  // treated as refreshable — except on auth endpoints themselves.
  if (res.status === 401 && options.retryOn401 !== false && !path.startsWith("/api/auth/")) {
    if (await tryRefresh()) {
      res = await rawFetch(path, options);
    } else {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Unwrap common backend envelopes: `{ data: X }` or bare `X`. */
export function unwrap<T>(body: unknown): T {
  if (body != null && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

/** Normalize a paginated list response into items + total. */
export function unwrapList<T>(body: unknown): { items: T[]; total: number } {
  const data = unwrap<unknown>(body);
  if (Array.isArray(data)) return { items: data as T[], total: data.length };
  if (data != null && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const items = (obj.items ?? obj.results ?? obj.products ?? obj.orders ?? obj.data) as
      | T[]
      | undefined;
    if (Array.isArray(items)) {
      const total =
        (obj.total as number | undefined) ??
        (obj.totalCount as number | undefined) ??
        (obj.count as number | undefined) ??
        ((obj.pagination as { total?: number } | undefined)?.total as number | undefined) ??
        items.length;
      return { items, total };
    }
  }
  return { items: [], total: 0 };
}
