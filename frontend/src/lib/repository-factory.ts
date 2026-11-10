import { ApiRepository } from "./api-repository";
import { API_ENABLED } from "./config";
import { LocalRepository } from "./local-repository";
import seed from "./seed.json";
import type { Workspace } from "./workspace-model";

export const repository = API_ENABLED
  ? new ApiRepository()
  : new LocalRepository(seed as Workspace);
