const Database = require("better-sqlite3");
const db = new Database("./data/analytics.db", { readonly: true });

console.log(
  "daily sample:",
  JSON.stringify(
    db
      .prepare(
        "SELECT date, commits, pull_requests, issues, reviews, releases, additions, deletions, active_repositories, total_activity FROM daily_activity ORDER BY date DESC LIMIT 5",
      )
      .all(),
    null,
    1,
  ),
);

const agg = db
  .prepare(
    "SELECT SUM(commits) c, SUM(pull_requests) p FROM daily_activity WHERE user_id=2",
  )
  .get();
console.log("agg totals:", JSON.stringify(agg));

const raw = db
  .prepare(
    "SELECT COUNT(*) n FROM commits c JOIN repositories r ON c.repository_id=r.id WHERE r.owner_id=2 AND c.author_login='kalyzet'",
  )
  .get();
console.log("raw user commits:", JSON.stringify(raw));

db.close();
