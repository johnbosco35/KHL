/**
 * Thin client for the KH Luxury API (server/). Set VITE_API_URL to the API's /api base URL;
 * it defaults to the local dev server in development and the deployed API in production.
 */
const DEFAULT_API_URL = import.meta.env.DEV
  ? "http://localhost:4100/api"
  : "https://khl-ipt2.onrender.com/api";

export const API_URL = (
  (import.meta.env["VITE_API_URL"] as string | undefined) || DEFAULT_API_URL
).replace(/\/$/, "");

const WRONG_SERVER = `The server at ${API_URL} is not the KH Luxury API. Another app may be using that port. Start the API in server/ (npm run dev) and make sure VITE_API_URL matches its address.`;

/** Asks /health whether API_URL really is our API (cached). Used to explain 404s. */
let isOurApi: Promise<boolean> | undefined;
function checkIsOurApi() {
  isOurApi ??= fetch(`${API_URL}/health`)
    .then((r) => r.json() as Promise<{ service?: string }>)
    .then((d) => d.service === "kh-luxury-api")
    .catch(() => false);
  return isOurApi;
}

const TOKEN_KEY = "kh-luxury-token";

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t: string | null) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string>,
  ) {
    super(message);
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function api<T = unknown>(method: Method, path: string, body?: unknown): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new ApiError(
      0,
      import.meta.env.DEV
        ? `Cannot reach the KH Luxury API at ${API_URL}. Start it with "npm run dev" in the server folder.`
        : "Cannot reach the KH Luxury server. Check your connection and try again.",
    );
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as { error?: string; details?: Record<string, string> };
  if (!res.ok) {
    if (res.status === 404 && !(await checkIsOurApi())) throw new ApiError(0, WRONG_SERVER);
    throw new ApiError(res.status, data.error ?? `Request failed (${res.status})`, data.details);
  }
  return data as T;
}

export const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong. Please try again.";

/** Uploads a data URL and returns its hosted URL; other values (existing URLs) pass through. */
export async function uploadIfDataUrl(
  value: string,
  folder: "products" | "categories" | "reviews" | "receipts" | "designs" | "misc",
): Promise<string> {
  if (!value.startsWith("data:")) return value;
  const { url } = await api<{ url: string }>("POST", "/uploads", { dataUrl: value, folder });
  return url;
}
