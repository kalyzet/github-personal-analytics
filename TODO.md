# GitHub Personal Analytics — TODO

Acuan utama: `SCHEMA.md` (fix), didukung `PRD.md` dan `DESIGN.md`.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · SQLite + Drizzle ORM · Custom GitHub OAuth · Recharts · pnpm

---

## Fase 1 — Foundation ✅ DONE

- [x] Scaffold Next.js + TypeScript + Tailwind (`pnpm create next-app`)
- [x] Install dependencies: `drizzle-orm`, `better-sqlite3`, `drizzle-kit`
- [x] Setup struktur folder sesuai SCHEMA.md bagian 5
    - [x] `src/app/`
    - [x] `src/components/ui/`
    - [x] `src/lib/db/` (client.ts, schema.ts)
    - [x] `src/lib/github/`, `src/lib/auth/`, `src/lib/utils/` (placeholder)
    - [x] `src/services/sync/`, `src/services/analytics/`, `src/services/insights/` (placeholder)
    - [x] `src/types/`, `src/config/`
    - [x] `data/` untuk analytics.db
- [x] Buat Drizzle schema — 16 tabel:
    - [x] Identity: `users`, `github_accounts`
    - [x] GitHub data: `repositories`, `repository_languages`, `commits`, `pull_requests`, `pull_request_reviews`, `issues`, `issue_labels`, `releases`
    - [x] Analytics: `daily_activity`, `repository_activity`, `analytics_snapshots`, `insights`
    - [x] System: `sync_jobs`, `sync_cursors`
- [x] Constraint & index sesuai SCHEMA.md:
    - [x] UNIQUE(github_user_id) pada users
    - [x] UNIQUE(owner_id, github_id) pada repositories
    - [x] UNIQUE(repository_id, sha) pada commits
    - [x] UNIQUE(repository_id, number) pada pull_requests & issues
    - [x] UNIQUE(user_id, date) pada daily_activity
    - [x] UNIQUE(repository_id, date) pada repository_activity
    - [x] Index commits: (repository_id, committed_at), (author_login, committed_at)
- [x] Environment files: `.env.local`, `.env.example`
- [x] `.gitignore`: `.env*`, `data/`, `node_modules`, dll.
- [x] Script drizzle-kit: `db:push`, `db:studio`, `db:generate`
- [x] Verifikasi: migration push sukses + 16 tabel terbuat + unique constraint jalan + tsc & eslint & next build lolos

## Fase 2 — GitHub Integration ✅ DONE

- [x] GitHub OAuth App setup (client id / secret)
- [x] Route handlers `/api/auth/github/*` (login, callback, logout)
- [x] Token exchange server-side + enkripsi token (AES-256-GCM) → `github_accounts`
- [x] Session management (cookie httpOnly, HMAC-signed payload, TTL 30 hari)
- [x] `lib/github/client.ts` — abstraction layer REST API
- [x] Rate limit handling (baca header x-ratelimit-*, throw GithubRateLimitError + reset time, retry backoff untuk 5xx/403 transient)
- [x] Pagination helper (`paginate()`, per_page=100, loop sampai habis, cap maxPages)
- [x] Modul endpoint: `users.ts`, `repositories.ts`, `commits.ts` (+detail), `pull-requests.ts`, `issues.ts`, `reviews.ts`, `releases.ts`, `languages.ts`
- [x] DB helper upsert user/account (`lib/db/repositories/users.ts`)

## Fase 3 — Sync Engine ✅ DONE

- [x] `sync_jobs` logging (PENDING/RUNNING/SUCCESS/FAILED) + stale job auto-FAIL saat proses mati
- [x] Full sync: user → repositories → per-repo resources → upsert
- [x] Incremental sync via `sync_cursors` (`last_synced_at`) + early-stop predicate di pagination
- [x] UPSERT strategy semua entity via onConflictDoUpdate (tanpa duplicate data)
- [x] Aggregation rebuild → `daily_activity` & `repository_activity` (transaksional, full recalc dari raw data)
- [x] Commit stats backfill (additions/deletions/changed_files) — budget 200 request/job, concurrency 8
- [x] API routes `/api/sync/start` (background job + guard concurrency) & `/api/sync/status`
- [x] Halaman Sync: last sync, status live (polling), Sync Now, Full Resync, rate limit usage, sync history
- [x] Rate limit pre-check (sync dibatalkan jika sisa quota < 50)
- [x] Live progress update ke DB tiap repo selesai

## Fase 4 — Dashboard & Analytics

- [ ] Analytics engine: streaks, tren, distribusi repo/bahasa, commit pattern
- [ ] Developer metrics (activity, consistency, collaboration)
- [ ] API routes analytics & dashboard
- [ ] Layout UI sesuai DESIGN.md: dark-first, sidebar 240px, topbar
- [ ] Design tokens: warna zinc + accent #8B5CF6/#06B6D4, Inter + JetBrains Mono
- [ ] Dashboard page: metric cards, heatmap, activity trend, top repos, languages, insights
- [ ] Halaman Activity, Commits, Pull Requests, Repositories (+detail), Technologies
- [ ] Charts dengan Recharts (heatmap, line/area, bar, donut)
- [ ] Empty states, loading skeletons, error states, toast, modal
- [ ] Responsive: tablet (sidebar 72px), mobile (drawer/bottom nav)

## Fase 5 — Polish & V1 Wrap-up

- [ ] Settings page (account, connection, privacy, danger zone)
- [ ] Disconnect GitHub + delete all data
- [ ] Halaman Insights & Milestones (V2 scope, opsional di V1)
- [ ] Review keamanan: token tidak ke client, .env tidak masuk git
- [ ] Backup manual SQLite (dokumentasi singkat)

---

## Catatan Keputusan

| Keputusan       | Pilihan                                                       |
| --------------- | ------------------------------------------------------------- |
| Database V1     | SQLite local-first (SCHEMA.md fix, bukan PostgreSQL dari PRD) |
| ORM             | Drizzle ORM                                                   |
| Auth            | Custom GitHub OAuth (tanpa NextAuth)                          |
| Package manager | pnpm                                                          |
| Timestamps      | Integer unix timestamp (`mode: "timestamp"`)                  |
| Boolean SQLite  | `integer` dengan `mode: "boolean"`                            |

### GitHub OAuth App (terdaftar)

```text
Application name:          Personal Analytics
Homepage URL:              http://localhost:3000
Description:               Personal GitHub activity analytics dashboard.
Authorization callback:    http://localhost:3000/api/auth/github/callback
```

Client ID & Client Secret → simpan di `.env.local` (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`). Secret tidak boleh masuk git.

---

## Progress Log

### Fase 1 — selesai 2026-08-24

- Scaffold Next.js 16.3.2 (App Router, src dir, Tailwind v4, Turbopack build)
- Dependencies: drizzle-orm 0.45.2, better-sqlite3 13.0.3, drizzle-kit 0.31.10, dotenv
- `pnpm-workspace.yaml`: allowBuilds untuk better-sqlite3 & esbuild (pnpm 11)
- Schema 16 tabel di `src/lib/db/schema.ts`, client di `src/lib/db/client.ts` (WAL mode, foreign_keys ON, auto-mkdir data dir)
- `drizzle.config.ts` + script `db:*`
- Verifikasi: `db:push` sukses, 16 tabel ada, unique constraint OK, smoke test insert/delete OK, `tsc --noEmit` bersih, eslint bersih, `next build` sukses

### Fase 2 — selesai 2026-08-24

- Auth:
  - `src/lib/auth/crypto.ts` — AES-256-GCM encrypt/decrypt token (format iv:tag:ciphertext hex), key dari `TOKEN_ENCRYPTION_KEY`
  - `src/lib/auth/session.ts` — cookie httpOnly `gpa_session`, payload HMAC-SHA256 signed, TTL 30 hari
- GitHub client (`src/lib/github/`):
  - `client.ts` — fetch abstraction dengan Bearer auth + X-GitHub-Api-Version, retry exponential backoff untuk 5xx/network, `GithubRateLimitError` dengan reset time saat remaining=0, helper `paginate()` (per_page=100) dan `getRateLimitStatus()`
  - 8 modul endpoint typed sesuai struktur SCHEMA.md
- DB helper: `src/lib/db/repositories/users.ts` — upsertUser & saveAccountToken via onConflictDoUpdate
- OAuth routes:
  - `/api/auth/github/login` — redirect ke authorize URL (scope `read:user repo`) + state cookie anti-CSRF
  - `/api/auth/github/callback` — validasi state, exchange code → token, fetch user, upsert users + github_accounts (token terenkripsi), set session
  - `/api/auth/github/logout` — GET/POST destroy session
- UI placeholder dark-first: landing page (`Connect GitHub` / `Buka Dashboard`) + dashboard placeholder (info user, status token, logout)
- Verifikasi live test: login route → 307 ke github.com/login/oauth/authorize dengan param benar + state cookie; home 200; `/dashboard` tanpa session redirect ke `/`; tsc/eslint/build bersih

### Fase 3 — selesai 2026-08-25

- DB helpers:
  - `lib/db/repositories/repositories.ts` — upsert batch (chunked) untuk repos, languages, commits, PRs, reviews (replace), issues (+labels), releases; semua via `onConflictDoUpdate` dengan `excluded.*`
  - `lib/db/repositories/sync.ts` — create/update job, cursors per (user, repo, resource), history
  - `lib/db/repositories/aggregation.ts` — rebuild `daily_activity` + `repository_activity` dari raw data dalam satu transaksi
- Sync engine (`services/sync/engine.ts`):
  - Pre-check rate limit (<50 sisa → batal), stale RUNNING job → auto FAILED "Sync interrupted"
  - Per repo: languages → commits (list + backfill detail stats budget 200/job, concurrency 8) → PRs + reviews → issues + labels → releases → cursor update → live progress ke DB
  - Incremental mode pakai cursor `last_synced_at`; pagination dengan early-stop saat item lebih lama dari cursor
- API: POST `/api/sync/start` (fire-and-forget background job, guard concurrency, FULL/INCREMENTAL otomatis) & GET `/api/sync/status` (latest job, history, stats count, rate limit)
- UI: halaman `/sync` dark-first dengan polling adaptif (2s saat running / 15s idle), Sync Now, Full Resync, kartu statistik, tabel history
- Hasil test sync nyata (akun kalyzet): SUCCESS — 45 repos, 2.415 commits, 34 PRs, 7 issues, 5 releases, 106 language entries; agregasi 109 hari aktif & 131 repo-hari; konsistensi terverifikasi (SUM agregasi = COUNT raw = 464)
- Script util: `scripts/run-sync.ts` (trigger sync via CLI)
