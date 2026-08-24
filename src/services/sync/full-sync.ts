import { requestSync } from "./engine";

export async function runFullSync(userId: number) {
  return requestSync(userId, "FULL");
}
