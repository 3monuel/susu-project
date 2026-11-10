import { API_ENABLED } from "./config";
import { getSessionUserId } from "./auth-storage";

const LOCAL_ONBOARDING_KEY = "susu.onboarding.completed.local";
const API_ONBOARDING_PREFIX = "susu.onboarding.completed.user.";
const completedInMemory = new Set<string>();

function getOnboardingKey(): string {
  if (!API_ENABLED) return LOCAL_ONBOARDING_KEY;
  // The stable user ID makes completion persist across logins and token refreshes.
  return `${API_ONBOARDING_PREFIX}${getSessionUserId() ?? "authenticated-user"}`;
}

export function hasCompletedWelcomeTour(): boolean {
  const key = getOnboardingKey();
  if (completedInMemory.has(key)) return true;
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

export function completeWelcomeTour(): void {
  const key = getOnboardingKey();
  completedInMemory.add(key);
  try {
    localStorage.setItem(key, "true");
  } catch {
    // The tour can still close if browser storage is unavailable.
  }
}
