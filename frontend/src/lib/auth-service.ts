import { API_ENABLED } from "./config";
import { apiFetch } from "./http";
import { clearToken, setSessionUserId, setToken } from "./auth-storage";
import type { User } from "./types";

type AuthResult = { token: string; user: User };

export const authService = {
  isConfigured: API_ENABLED,
  async login(email: string, password: string) {
    const result = await apiFetch<AuthResult>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(result.token);
    setSessionUserId(result.user.id);
    return result.user;
  },
  async register(name: string, email: string, password: string) {
    const result = await apiFetch<AuthResult>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setToken(result.token);
    setSessionUserId(result.user.id);
    return result.user;
  },
  async logout() {
    try {
      await apiFetch<void>("/api/auth/logout", { method: "POST" });
    } catch {
      // JWT can be stateless, so the local session must always be closed.
    } finally {
      clearToken();
    }
  },
};
