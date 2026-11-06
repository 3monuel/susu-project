const TOKEN_KEY = "susu.auth.token";
let memoryToken: string | null = null;

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

export function clearToken(): void {
  memoryToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // The caller still continues as signed out when storage is unavailable.
  }
}
