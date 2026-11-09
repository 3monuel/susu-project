import { API_ENABLED } from "./config";
import { getToken, hasLocalSession } from "./auth-storage";

/** Checks the session type configured for this build. */
export function hasActiveSession(): boolean {
  return API_ENABLED ? Boolean(getToken()) : hasLocalSession();
}
