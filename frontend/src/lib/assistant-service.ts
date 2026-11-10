import { API_ENABLED } from "./config";
import { apiFetch } from "./http";
import type { Priority } from "./types";

export interface SuggestedTask {
  name: string;
  description: string;
  dueDate: string | null;
  priority: Priority;
}

export class AssistantService {
  get isConfigured() {
    return API_ENABLED;
  }

  async suggestPlan(projectId: string, request: string): Promise<SuggestedTask[]> {
    if (!API_ENABLED) throw new Error("No hay una API de IA configurada.");
    // TODO: el proveedor y el modelo de IA deben definirse en el backend.
    return apiFetch<SuggestedTask[]>("/api/assistant/plan", {
      method: "POST",
      body: JSON.stringify({ projectId, request }),
    });
  }
}

export const assistantService = new AssistantService();
