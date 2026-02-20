const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const STORAGE_KEYS = {
  user: "user",
  accessToken: "accessToken",
  refreshToken: "refreshToken"
};

function toURL(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath;
}

function normalizeHeaders(body, headers = {}) {
  const nextHeaders = new Headers(headers);
  if (body && !(body instanceof FormData) && !nextHeaders.has("Content-Type")) {
    nextHeaders.set("Content-Type", "application/json");
  }
  return nextHeaders;
}

async function parseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : {};
}

function createApiError(status, payload) {
  const error = new Error(payload?.message || "Request failed");
  error.status = status;
  error.payload = payload;
  return error;
}

export function getStoredUser() {
  try {
    const value = localStorage.getItem(STORAGE_KEYS.user);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.accessToken) || "";
}

export function getRefreshToken() {
  return localStorage.getItem(STORAGE_KEYS.refreshToken) || "";
}

export function storeSession({ user, accessToken, refreshToken }) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  }
  if (accessToken) {
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
}

async function request(path, options = {}) {
  const response = await fetch(toURL(path), options);
  const payload = await parseBody(response);

  if (!response.ok) {
    throw createApiError(response.status, payload);
  }

  return payload;
}

export async function apiFetch(path, options = {}) {
  const body = options.body;
  const normalizedBody =
    body && typeof body === "object" && !(body instanceof FormData)
      ? JSON.stringify(body)
      : body;

  return request(path, {
    ...options,
    body: normalizedBody,
    headers: normalizeHeaders(normalizedBody, options.headers)
  });
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return "";
  }

  const payload = await apiFetch("/api/auth/refresh", {
    method: "POST",
    body: { refreshToken }
  });

  if (!payload?.accessToken) {
    throw new Error("Invalid refresh token response");
  }

  localStorage.setItem(STORAGE_KEYS.accessToken, payload.accessToken);
  return payload.accessToken;
}

export async function authFetch(path, options = {}, retry = true) {
  const token = getAccessToken();
  const headers = normalizeHeaders(options.body, options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    return await apiFetch(path, { ...options, headers });
  } catch (error) {
    if (retry && error.status === 401 && getRefreshToken()) {
      try {
        const refreshedToken = await refreshAccessToken();
        const retryHeaders = normalizeHeaders(options.body, options.headers);
        retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);
        return await apiFetch(path, { ...options, headers: retryHeaders });
      } catch {
        clearSession();
      }
    }
    throw error;
  }
}

export function avatarUrl(userLike) {
  const avatar = userLike?.avatar || "";
  const name = userLike?.name || userLike?.username || "User";

  if (!avatar) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=0f172a&color=f8fafc`;
  }

  if (/^https?:\/\//i.test(avatar)) {
    return avatar;
  }

  return API_BASE ? `${API_BASE}${avatar}` : avatar;
}

export default API_BASE;
