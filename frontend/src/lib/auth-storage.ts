const TOKEN_KEY = "susu.auth.token";
const USER_ID_KEY = "susu.auth.user-id";
const LOCAL_SESSION_KEY = "susu.local.session";
let memoryToken: string | null = null;
let memoryUserId: string | null = null;
let memoryLocalSession = false;

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    memoryToken = localStorage.getItem(TOKEN_KEY);
    return memoryToken;
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  memoryToken = token;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Keep the active session in memory when persistent storage is unavailable.
  }
}

export function getSessionUserId(): string | null {
  if (memoryUserId) return memoryUserId;
  try {
    memoryUserId = localStorage.getItem(USER_ID_KEY);
    return memoryUserId;
  } catch {
    return null;
  }
}

export function setSessionUserId(userId: string): void {
  memoryUserId = userId;
  try {
    localStorage.setItem(USER_ID_KEY, userId);
  } catch {
    // The current session can still proceed without persistent browser storage.
  }
}

export function clearToken(): void {
  memoryToken = null;
  memoryUserId = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
  } catch {
    // The caller still continues as signed out when storage is unavailable.
  }
}

export function startLocalSession(): void {
  memoryLocalSession = true;
  try {
    localStorage.setItem(LOCAL_SESSION_KEY, "true");
  } catch {
    // Keep the local session for the current tab if storage is unavailable.
  }
}

export function hasLocalSession(): boolean {
  if (memoryLocalSession) return true;
  try {
    memoryLocalSession = localStorage.getItem(LOCAL_SESSION_KEY) === "true";
    return memoryLocalSession;
  } catch {
    return false;
  }
}

export function clearLocalSession(): void {
  memoryLocalSession = false;
  try {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  } catch {
    // The in-memory session is still cleared.
  }
}
