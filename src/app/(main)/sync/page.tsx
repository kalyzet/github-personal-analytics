import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import SyncClient from "@/components/sync/sync-client";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
  const session = await getSession();
  if (!session) redirect("/");

  return <SyncClient />;
}
