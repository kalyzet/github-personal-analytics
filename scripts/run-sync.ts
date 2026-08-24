import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { sqlite } from "../src/lib/db/client";
import { requestSync } from "../src/services/sync/engine";
import { getLatestSyncJob } from "../src/lib/db/repositories/sync";

const userId = Number(process.argv[2] ?? 1);

async function main() {
  console.log(`Requesting FULL sync for user ${userId}...`);
  const outcome = await requestSync(userId, "FULL");
  if (!outcome.started) {
    console.log("Sync not started:", outcome.reason);
    process.exit(1);
  }
  console.log(`Sync job #${outcome.jobId} started.`);

  for (let i = 0; i < 600; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const job = await getLatestSyncJob(userId);
    const counts = sqlite
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM repositories) AS repos,
           (SELECT COUNT(*) FROM commits) AS commits,
           (SELECT COUNT(*) FROM pull_requests) AS prs,
           (SELECT COUNT(*) FROM issues WHERE is_pull_request = 0) AS issues,
           (SELECT COUNT(*) FROM daily_activity) AS days,
           (SELECT COUNT(*) FROM repository_languages) AS langs`,
      )
      .get() as Record<string, number>;
    console.log(
      `[poll] status=${job?.status} records=${job?.recordsCreated} | repos=${counts.repos} commits=${counts.commits} prs=${counts.prs} issues=${counts.issues} days=${counts.days} langs=${counts.langs}`,
    );
    if (!job) continue;
    if (job.status === "SUCCESS") {
      console.log("\n=== SYNC SUCCESS ===");
      console.log(`Repositories scanned: ${job.repositoriesScanned}`);
      console.log(`Records processed: ${job.recordsCreated}`);
      process.exit(0);
    }
    if (job.status === "FAILED") {
      console.log("\n=== SYNC FAILED ===");
      console.log(job.errorMessage);
      process.exit(1);
    }
  }
  console.log("Timed out waiting for sync to finish");
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
