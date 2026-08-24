import { requestSync } from "./engine";

export async function runIncrementalSync(userId: number) {
  return requestSync(userId, "INCREMENTAL");
}
