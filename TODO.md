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

## Fase 2 — GitHub Integration

- [ ] GitHub OAuth App setup (client id / secret)
- [ ] Route handlers `/api/auth/github/*` (login, callback, logout)
- [ ] Token exchange server-side + enkripsi token → `github_accounts`
- [ ] Session management (cookie httpOnly)
- [ ] `lib/github/client.ts` — abstraction layer REST API
- [ ] Rate limit handling (baca header, stop sync saat limit, retry backoff)
- [ ] Pagination helper (loop semua halaman)
- [ ] Modul endpoint: `users.ts`, `repositories.ts`, `commits.ts`, `pull-requests.ts`, `issues.ts`, `reviews.ts`, `releases.ts`, `languages.ts`

## Fase 3 — Sync Engine

- [ ] `sync_jobs` logging (PENDING/RUNNING/SUCCESS/FAILED)
- [ ] Full sync: user → repositories → per-repo resources → upsert
- [ ] Incremental sync via `sync_cursors` (`last_synced_at`)
- [ ] UPSERT strategy semua entity (tanpa duplicate data)
- [ ] Aggregation → `daily_activity` & `repository_activity`
- [ ] API routes `/api/sync/start`, `/api/sync/status`
- [ ] Halaman Sync: last sync, status, progress per resource, sync history
- [ ] Caching strategy (metadata jarang berubah vs aktivitas sering)

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

| Keputusan | Pilihan |
|---|---|
| Database V1 | SQLite local-first (SCHEMA.md fix, bukan PostgreSQL dari PRD) |
| ORM | Drizzle ORM |
| Auth | Custom GitHub OAuth (tanpa NextAuth) |
| Package manager | pnpm |
| Timestamps | Integer unix timestamp (`mode: "timestamp"`) |
| Boolean SQLite | `integer` dengan `mode: "boolean"` |

---

## Progress Log

### Fase 1 — selesai 2026-08-24

- Scaffold Next.js 16.3.2 (App Router, src dir, Tailwind v4, Turbopack build)
- Dependencies: drizzle-orm 0.45.2, better-sqlite3 13.0.3, drizzle-kit 0.31.10, dotenv
- `pnpm-workspace.yaml`: allowBuilds untuk better-sqlite3 & esbuild (pnpm 11)
- Schema 16 tabel di `src/lib/db/schema.ts`, client di `src/lib/db/client.ts` (WAL mode, foreign_keys ON, auto-mkdir data dir)
- `drizzle.config.ts` + script `db:*`
- Verifikasi: `db:push` sukses, 16 tabel ada, unique constraint OK, smoke test insert/delete OK, `tsc --noEmit` bersih, eslint bersih, `next build` sukses
