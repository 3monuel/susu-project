import { clearToken, getToken } from "./auth-storage";
import { API_URL } from "./config";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Comprueba tu conexión y vuelve a intentarlo.",
      0,
    );
  }

  const isAuthRequest = path === "/api/auth/login" || path === "/api/auth/register";
  if (response.status === 401 && !isAuthRequest) {
    clearToken();
    if (!location.pathname.startsWith("/iniciar-sesion")) location.assign("/iniciar-sesion");
    throw new ApiError("Tu sesión ha caducado. Inicia sesión de nuevo.", 401);
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as {
        message?: string;
        error?: string;
      };
      detail = body.message || body.error || "";
    } catch {
      // Use the stable Spanish fallback below.
    }
    throw new ApiError(
      detail ||
        (response.status === 401 && isAuthRequest
          ? "Correo o contraseña incorrectos."
          : "El servidor no pudo completar la solicitud."),
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
