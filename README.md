# GitHub Personal Analytics

Personal analytics dashboard yang mengumpulkan data aktivitas GitHub via GitHub API, lalu mengolahnya menjadi statistik, insight, tren, dan evaluasi perkembangan aktivitas sebagai developer.

> **Measure activity, don't pretend to measure developer ability.**

## Tech Stack

- Next.js 16 (App Router) · TypeScript · Tailwind CSS v4
- SQLite (local-first) + Drizzle ORM
- GitHub OAuth (custom) + REST API
- Recharts · Lucide Icons
- pnpm

## Menjalankan

```bash
pnpm install
pnpm db:push        # buat schema SQLite
cp .env.example .env.local   # isi GITHUB_CLIENT_ID & GITHUB_CLIENT_SECRET & TOKEN_ENCRYPTION_KEY
pnpm dev
```

Buka `http://localhost:3000` → **Connect GitHub** → **Sync Now** dari menu Sync.

## Backup Database

Database tersimpan sebagai satu file SQLite di `data/analytics.db`. Backup manual cukup dengan menyalin file tersebut:

```bash
mkdir backups
cp data/analytics.db backups/analytics-$(date +%F).db
```

Raw data (commits, PRs, issues, dll.) adalah source of truth — agregasi dan analytics bisa di-rebuild kapan saja, jadi backup file database sudah mencakup semuanya.

## Skrip Utilitas

```bash
pnpm db:push              # push schema ke SQLite
pnpm db:studio            # Drizzle Studio (lihat isi DB)
npx tsx scripts/run-sync.ts <userId>    # trigger full sync via CLI
```

## Dokumentasi Desain

- `PRD.md` — product requirements
- `DESIGN.md` — design system "Developer Observatory"
- `SCHEMA.md` — arsitektur & database design (acuan utama)
- `TODO.md` — progress implementasi per fase
