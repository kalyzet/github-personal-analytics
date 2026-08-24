const Database = require("better-sqlite3");
const db = new Database("./data/analytics.db");

const tables = db
  .prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  )
  .all();
console.log("Tables (" + tables.length + "):");
tables.forEach((t) => console.log(" - " + t.name));

// Smoke test: insert + unique constraint check
db.prepare(
  "INSERT INTO users (github_user_id, username) VALUES (?, ?)",
).run(999999, "smoke-test-user");
try {
  db.prepare(
    "INSERT INTO users (github_user_id, username) VALUES (?, ?)",
  ).run(999999, "duplicate-should-fail");
  console.log("ERROR: unique constraint not enforced!");
} catch (e) {
  console.log("\nUnique constraint OK: " + e.message);
}
db.prepare("DELETE FROM users WHERE github_user_id = ?").run(999999);
console.log("\nSmoke test insert/delete OK");

db.close();
