# GitHub Personal Analytics — Architecture & Database Design

## 1. Architecture Overview

GitHub Personal Analytics menggunakan arsitektur **local-first, modular, dan API-driven**.

Aplikasi mengambil data dari GitHub API, menyimpannya sebagai data lokal di SQLite, kemudian melakukan proses aggregation dan analytics sebelum data ditampilkan pada dashboard.

```text
                    ┌─────────────────────┐
                    │       GitHub        │
                    │    OAuth + API      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    GitHub Client    │
                    │                     │
                    │ REST API            │
                    │ Pagination          │
                    │ Rate Limit Handling │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Sync Engine     │
                    │                     │
                    │ Full Sync           │
                    │ Incremental Sync    │
                    │ Upsert              │
                    │ Sync State          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       SQLite        │
                    │    Local Database   │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
          ┌──────────────────┐   ┌──────────────────┐
          │ Analytics Engine │   │ Insight Engine   │
          └────────┬─────────┘   └────────┬─────────┘
                   │                      │
                   └──────────┬───────────┘
                              ▼
                    ┌─────────────────────┐
                    │    Next.js UI       │
                    │                     │
                    │ Dashboard           │
                    │ Charts              │
                    │ Analytics           │
                    │ Insights             │
                    └─────────────────────┘
```

---

# 2. Architectural Principles

## 2.1 GitHub API Is the Data Source

GitHub merupakan external data source.

GitHub bukan database utama aplikasi.

```text
GitHub
   ↓
Data Collection
   ↓
Local Database
```

Dashboard tidak mengambil seluruh data langsung dari GitHub.

---

## 2.2 SQLite Is the Application Data Store

SQLite digunakan sebagai database utama untuk V1.

```text
GitHub API
     ↓
SQLite
     ↓
Application
```

Alasan:

- Aplikasi bersifat personal.
- Fokus utama satu pengguna.
- Tidak membutuhkan database cloud.
- Tidak membutuhkan server database.
- Mudah di-backup.
- Sangat ringan.
- Private secara default.
- Tidak bergantung pada layanan database eksternal.

---

## 2.3 Dashboard Reads Local Data

Dashboard harus membaca data dari SQLite.

Tidak boleh melakukan pola:

```text
Page Render
    ↓
GitHub API
    ↓
Render Dashboard
```

Pola yang digunakan:

```text
Page Render
    ↓
Application API / Server
    ↓
SQLite
    ↓
Dashboard
```

Dengan demikian GitHub API hanya digunakan ketika melakukan synchronization.

---

# 3. Recommended Technology Stack

## Frontend

```text
Next.js
TypeScript
Tailwind CSS
```

## Backend

```text
Next.js Route Handlers
Server-side services
```

## Database

```text
SQLite
```

## ORM / Database Layer

Recommended:

```text
Drizzle ORM
```

Alternatif:

```text
Prisma
```

Untuk aplikasi kecil dan local-first, Drizzle direkomendasikan karena ringan dan schema SQL-friendly.

## GitHub Integration

```text
GitHub OAuth
GitHub REST API
```

GraphQL dapat ditambahkan di masa depan jika diperlukan.

## Charts

```text
Recharts
```

## Deployment

V1:

```text
Local Development
```

Jika membutuhkan cloud deployment:

```text
Next.js
+
PostgreSQL provider
```

SQLite tidak dijadikan persistent database utama pada environment serverless seperti Vercel.

---

# 4. Application Layers

Aplikasi dibagi menjadi beberapa layer.

```text
┌──────────────────────────────┐
│           UI Layer           │
│ Next.js / React Components   │
└──────────────┬───────────────┘
               │
┌──────────────▼───────────────┐
│        API / Route Layer     │
│ Route Handlers / Server API  │
└──────────────┬───────────────┘
               │
┌──────────────▼───────────────┐
│         Service Layer        │
│ Sync / Analytics / Insights  │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌──────────────┐ ┌──────────────┐
│ GitHub Client│ │ Database     │
│              │ │ Repository   │
└──────┬───────┘ └──────┬───────┘
       │                │
       ▼                ▼
   GitHub API         SQLite
```

---

# 5. Project Structure

Recommended structure:

```text
src/
│
├── app/
│   ├── dashboard/
│   ├── activity/
│   ├── commits/
│   ├── pull-requests/
│   ├── repositories/
│   ├── collaboration/
│   ├── technologies/
│   ├── insights/
│   ├── milestones/
│   ├── sync/
│   └── settings/
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── charts/
│   ├── repositories/
│   └── analytics/
│
├── lib/
│   ├── github/
│   │   ├── client.ts
│   │   ├── users.ts
│   │   ├── repositories.ts
│   │   ├── commits.ts
│   │   ├── pull-requests.ts
│   │   ├── issues.ts
│   │   ├── reviews.ts
│   │   ├── releases.ts
│   │   └── languages.ts
│   │
│   ├── db/
│   │   ├── client.ts
│   │   ├── schema.ts
│   │   └── repositories/
│   │
│   ├── auth/
│   └── utils/
│
├── services/
│   ├── sync/
│   │   ├── full-sync.ts
│   │   ├── incremental-sync.ts
│   │   ├── repository-sync.ts
│   │   ├── commit-sync.ts
│   │   ├── pull-request-sync.ts
│   │   └── issue-sync.ts
│   │
│   ├── analytics/
│   │   ├── activity.ts
│   │   ├── consistency.ts
│   │   ├── collaboration.ts
│   │   ├── project.ts
│   │   ├── technology.ts
│   │   └── developer-score.ts
│   │
│   └── insights/
│       └── insight-generator.ts
│
├── types/
│
└── config/
```

---

# 6. GitHub Integration

## 6.1 OAuth Flow

User melakukan:

```text
Connect GitHub
      ↓
GitHub Authorization
      ↓
User Approves
      ↓
Authorization Code
      ↓
Application Server
      ↓
Access Token
      ↓
Secure Storage
```

Access token tidak boleh dikirim atau disimpan pada client-side JavaScript.

---

# 7. Environment Variables

`.env.local`:

```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

GITHUB_API_URL=https://api.github.com

DATABASE_URL=file:./data/analytics.db

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`GITHUB_CLIENT_SECRET` bersifat server-only.

Jangan menggunakan:

```text
NEXT_PUBLIC_GITHUB_CLIENT_SECRET
```

---

# 8. GitHub Client

Semua komunikasi dengan GitHub API harus melalui satu abstraction layer.

```text
lib/github/
├── client.ts
├── users.ts
├── repositories.ts
├── commits.ts
├── pull-requests.ts
├── issues.ts
├── reviews.ts
├── releases.ts
└── languages.ts
```

Contoh interface konseptual:

```text
github.users.getCurrentUser()

github.repositories.list()

github.commits.list(repository)

github.pullRequests.list(repository)

github.issues.list(repository)

github.reviews.list(repository)
```

Tujuannya agar aplikasi tidak bergantung langsung pada implementation detail GitHub API.

---

# 9. GitHub API Data

Data yang dikumpulkan:

## User

```text
github_id
username
name
avatar
bio
created_at
followers
following
```

## Repository

```text
github_id
name
full_name
description
language
stars
forks
watchers
size
open_issues
topics
license
is_private
is_fork
is_archived
created_at
updated_at
pushed_at
```

## Commit

```text
sha
repository
author
committer
message
authored_at
committed_at
additions
deletions
changed_files
url
```

## Pull Request

```text
github_id
number
repository
author
state
created_at
updated_at
closed_at
merged_at
additions
deletions
changed_files
comments
```

## Review

```text
github_id
pull_request
reviewer
state
body
submitted_at
```

## Issue

```text
github_id
number
repository
author
state
created_at
updated_at
closed_at
comments
```

## Release

```text
github_id
repository
tag
name
author
published_at
is_draft
is_prerelease
```

---

# 10. Database Strategy

Database dibagi menjadi:

```text
Identity
GitHub Data
Analytics
System
```

```text
┌─────────────────────────────────────┐
│              SQLite                 │
├─────────────────────────────────────┤
│ Identity                            │
│ ├── users                           │
│ └── github_accounts                 │
│                                     │
│ GitHub Data                         │
│ ├── repositories                    │
│ ├── repository_languages            │
│ ├── commits                         │
│ ├── pull_requests                   │
│ ├── pull_request_reviews             │
│ ├── issues                          │
│ ├── issue_labels                    │
│ └── releases                        │
│                                     │
│ Analytics                           │
│ ├── daily_activity                  │
│ ├── repository_activity             │
│ ├── analytics_snapshots             │
│ └── insights                        │
│                                     │
│ System                              │
│ ├── sync_jobs                       │
│ └── sync_cursors                    │
└─────────────────────────────────────┘
```

---

# 11. Database Schema

## users

```text
users
-----
id
github_user_id
username
display_name
avatar_url
bio
github_created_at
created_at
updated_at
```

Constraint:

```text
UNIQUE(github_user_id)
```

---

## github_accounts

```text
github_accounts
---------------
id
user_id
github_user_id
username
access_token_encrypted
token_expires_at
scope
connected_at
last_used_at
created_at
updated_at
```

Token harus disimpan secara aman.

---

## repositories

```text
repositories
------------
id
github_id
owner_id
name
full_name
description
html_url
primary_language
stars
forks
watchers
size
open_issues
is_private
is_fork
is_archived
github_created_at
github_updated_at
github_pushed_at
created_at
updated_at
```

Constraint:

```text
UNIQUE(owner_id, github_id)
```

---

## repository_languages

```text
repository_languages
--------------------
id
repository_id
language
bytes
percentage
calculated_at
```

---

## commits

```text
commits
-------
id
repository_id
sha
author_login
author_name
committer_login
committer_name
message
committed_at
authored_at
additions
deletions
changed_files
github_url
created_at
```

Constraint:

```text
UNIQUE(repository_id, sha)
```

Index:

```text
(repository_id, committed_at)
```

```text
(author_login, committed_at)
```

---

## pull_requests

```text
pull_requests
-------------
id
repository_id
github_id
number
title
state
author_login
created_at
updated_at
closed_at
merged_at
additions
deletions
changed_files
comments
is_merged
github_url
```

Constraint:

```text
UNIQUE(repository_id, number)
```

---

## pull_request_reviews

```text
pull_request_reviews
--------------------
id
pull_request_id
github_id
reviewer_login
state
body
submitted_at
```

---

## issues

```text
issues
------
id
repository_id
github_id
number
title
state
author_login
created_at
updated_at
closed_at
comments
github_url
```

Constraint:

```text
UNIQUE(repository_id, number)
```

---

## issue_labels

```text
issue_labels
------------
id
issue_id
name
color
```

---

## releases

```text
releases
--------
id
repository_id
github_id
tag_name
name
author_login
created_at
published_at
is_prerelease
is_draft
```

---

# 12. Analytics Tables

Analytics tidak menggantikan raw GitHub data.

Raw data tetap menjadi source of truth.

```text
GitHub Data
    ↓
Aggregation
    ↓
Analytics Tables
```

---

## daily_activity

```text
daily_activity
--------------
id
user_id
date

commits
pull_requests
issues
reviews
releases

additions
deletions

active_repositories
total_activity

created_at
updated_at
```

Constraint:

```text
UNIQUE(user_id, date)
```

---

## repository_activity

```text
repository_activity
-------------------
id
repository_id
date

commits
pull_requests
issues
reviews
releases

additions
deletions

total_activity

created_at
updated_at
```

Constraint:

```text
UNIQUE(repository_id, date)
```

---

# 13. Analytics Snapshots

Untuk menyimpan hasil evaluasi suatu periode.

```text
analytics_snapshots
-------------------
id
user_id

period_type
period_start
period_end

activity_score
consistency_score
collaboration_score
project_score
technology_score
maintenance_score

developer_score

created_at
```

Contoh:

```text
period_type:
MONTH

period_start:
2026-08-01

period_end:
2026-08-31

developer_score:
87
```

---

# 14. Insights

```text
insights
--------
id
user_id

type
title
description

severity

period_start
period_end

metadata

created_at
```

Contoh:

```json
{
    "previous_activity": 31,
    "current_activity": 38,
    "percentage_change": 22.58
}
```

`metadata` dapat disimpan sebagai JSON.

---

# 15. Sync System

## sync_jobs

```text
sync_jobs
---------
id
user_id

type
status

started_at
finished_at

repositories_scanned
records_created
records_updated

error_message

created_at
```

Type:

```text
FULL
INCREMENTAL
MANUAL
```

Status:

```text
PENDING
RUNNING
SUCCESS
FAILED
```

---

# 16. Sync Cursors

```text
sync_cursors
------------
id
user_id
repository_id

resource_type

last_synced_at
last_cursor

updated_at
```

Resource:

```text
commits
pull_requests
issues
reviews
releases
languages
```

Tujuannya mendukung incremental synchronization.

---

# 17. Initial Sync

Saat pertama kali terhubung:

```text
Connect GitHub
      ↓
Get Current User
      ↓
Get Repositories
      ↓
For Each Repository
      │
      ├── Get Languages
      ├── Get Commits
      ├── Get PRs
      ├── Get Issues
      ├── Get Reviews
      └── Get Releases
      ↓
Normalize
      ↓
UPSERT SQLite
      ↓
Generate Aggregations
      ↓
Generate Analytics
```

---

# 18. Incremental Sync

Sync berikutnya hanya mengambil data baru/perubahan.

```text
Manual / Scheduled Sync
          ↓
Check Sync Cursor
          ↓
Fetch Changes
          ↓
Normalize
          ↓
UPSERT
          ↓
Update Aggregation
          ↓
Update Analytics
```

Jangan mengambil seluruh histori pada setiap sync.

---

# 19. UPSERT Strategy

Semua entity GitHub harus menggunakan identifier yang stabil.

Contoh commit:

```text
(repository_id, sha)
```

PR:

```text
(repository_id, number)
```

Issue:

```text
(repository_id, number)
```

Dengan demikian:

```text
Sync #1
→ INSERT

Sync #2
→ UPDATE existing
→ INSERT new
```

Tidak terjadi duplicate data.

---

# 20. Pagination

GitHub API menggunakan pagination pada banyak endpoint.

Sync Engine harus terus mengambil halaman berikutnya sampai data habis.

```text
Page 1
 ↓
Page 2
 ↓
Page 3
 ↓
...
 ↓
No More Data
```

Jangan mengasumsikan satu request berisi seluruh histori.

---

# 21. Rate Limit Handling

GitHub API memiliki batas request.

GitHub Client harus:

- membaca rate-limit response;
- menghentikan sync ketika limit tidak mencukupi;
- menyimpan status sync;
- retry request yang aman;
- menggunakan delay ketika diperlukan;
- menghindari request redundant;
- menggunakan incremental sync.

Jika rate limit tercapai:

```text
Sync paused

Reason:
GitHub API rate limit reached.

Resume:
Later
```

---

# 22. Caching Strategy

Data GitHub yang jarang berubah tidak perlu selalu diambil.

Contoh:

```text
User profile
Repository metadata
Repository languages
```

Data tersebut dapat memiliki refresh interval lebih panjang.

Sedangkan:

```text
Commits
PR
Issues
Reviews
```

dapat disinkronkan lebih sering.

---

# 23. Analytics Pipeline

Analytics tidak langsung membaca GitHub API.

```text
SQLite
   ↓
Raw GitHub Data
   ↓
Aggregation
   ↓
Feature Extraction
   ↓
Metrics
   ↓
Score
   ↓
Insights
```

Contoh:

```text
Commits
+
PR
+
Issues
+
Reviews
+
Active Days
       ↓
Activity Metrics
       ↓
Consistency Metrics
       ↓
Developer Score
```

---

# 24. Developer Score

Developer Score terdiri dari:

```text
Activity          25%
Consistency       20%
Collaboration     20%
Project Health    15%
Technology        10%
Maintenance       10%
```

Score harus explainable.

Contoh:

```text
Developer Score: 87

Activity:        91
Consistency:     94
Collaboration:   72
Project Health:  84
Technology:      88
Maintenance:     81
```

Score merupakan **analytics indicator**, bukan ukuran kemampuan programming.

---

# 25. Storage Strategy

Aplikasi hanya menyimpan metadata GitHub.

Disimpan:

```text
✓ Commit metadata
✓ PR metadata
✓ Issue metadata
✓ Review metadata
✓ Repository metadata
✓ Language statistics
✓ Activity aggregates
```

Tidak disimpan:

```text
✗ Full repository source code
✗ .git directories
✗ node_modules
✗ Build output
✗ Full commit patches
✗ Binary files
✗ Repository archives
```

Dengan pendekatan ini database tetap relatif kecil.

---

# 26. Expected Storage

Untuk penggunaan personal:

```text
5,000 commits
→ beberapa hingga puluhan MB

50,000 commits
→ puluhan hingga ratusan MB

100,000 commits
→ sekitar ratusan MB tergantung metadata
```

Database tidak seharusnya tiba-tiba mencapai beberapa GB selama aplikasi hanya menyimpan metadata.

Storage terbesar kemungkinan berasal dari:

```text
commit metadata
PR metadata
issue metadata
```

bukan source code.

---

# 27. Backup

Karena SQLite berupa file:

```text
data/
└── analytics.db
```

backup menjadi sangat mudah.

Contoh:

```text
backups/
├── analytics-2026-08-24.db
├── analytics-2026-08-31.db
└── analytics-2026-09-07.db
```

Backup dapat dilakukan secara manual pada V1.

---

# 28. Data Recovery

Jika analytics aggregation rusak:

```text
Raw GitHub Data
      ↓
Recalculate
      ↓
daily_activity
      ↓
repository_activity
      ↓
analytics
      ↓
insights
```

Raw data menjadi source of truth.

Derived analytics dapat dibuat ulang kapan saja.

---

# 29. API Routes

Internal API:

```text
/api
│
├── auth/
│   └── github/
│
├── dashboard/
│
├── analytics/
│   ├── activity/
│   ├── commits/
│   ├── repositories/
│   ├── pull-requests/
│   └── technologies/
│
├── repositories/
│
├── insights/
│
├── sync/
│   ├── start/
│   └── status/
│
└── settings/
```

Frontend hanya berinteraksi dengan API/service aplikasi.

---

# 30. Security

## OAuth Secret

```text
GITHUB_CLIENT_SECRET
```

hanya boleh digunakan server-side.

## Access Token

Access token pengguna:

- Tidak boleh dikirim ke client.
- Tidak boleh disimpan plaintext.
- Tidak boleh dimasukkan ke Git.
- Harus dihapus ketika koneksi GitHub diputus.

## Environment

`.env.local` harus masuk `.gitignore`.

`.env.example` boleh masuk repository.

---

# 31. Local-First Architecture

V1 menggunakan:

```text
┌────────────────────────────┐
│       Local Machine        │
│                            │
│  Next.js                   │
│     │                      │
│     ├── GitHub Client      │
│     ├── Sync Engine        │
│     ├── Analytics Engine   │
│     │                      │
│     └── SQLite             │
│                            │
└────────────┬───────────────┘
             │
             ▼
         GitHub API
```

Keuntungan:

- Tidak membutuhkan Supabase.
- Tidak membutuhkan database cloud.
- Data lebih private.
- Tidak ada biaya database.
- Tidak tergantung internet untuk melihat analytics yang sudah tersimpan.
- GitHub hanya diperlukan saat synchronization.

---

# 32. Cloud Migration Strategy

Jika suatu saat aplikasi perlu online:

```text
SQLite
   ↓
PostgreSQL
```

Schema harus dirancang sejak awal agar migration mudah.

Target arsitektur:

```text
V1

Next.js
+
SQLite
+
GitHub API


Future

Next.js
+
PostgreSQL
+
GitHub API
+
Optional Worker
```

Tidak perlu mengubah business logic secara besar-besaran.

---

# 33. Future Worker Architecture

Jika data semakin besar atau sync semakin lama:

```text
Next.js
    │
    ▼
Sync Job
    │
    ▼
Queue
    │
    ▼
Worker
    │
    ▼
GitHub API
    │
    ▼
Database
```

Komponen seperti queue/worker tidak diperlukan pada V1.

---

# 34. Future ML Layer

Arsitektur disiapkan untuk ML.

```text
SQLite
   ↓
Feature Engineering
   ↓
ML Dataset
   ↓
Model
   ↓
Prediction
   ↓
Analytics Dashboard
```

Potensi:

- Activity forecasting.
- Activity anomaly detection.
- Repository activity prediction.
- Development pattern analysis.

ML tidak menjadi dependency utama V1.

---

# 35. Final Recommended Architecture

Untuk versi pertama:

```text
┌──────────────────────────────┐
│          Next.js             │
│                              │
│  Dashboard                   │
│  Analytics                   │
│  Insights                    │
│  Repository Views            │
│                              │
│  Route Handlers              │
│         │                    │
│         ▼                    │
│  Service Layer               │
│     │            │           │
│     ▼            ▼           │
│ GitHub Client   SQLite       │
│     │            │           │
└─────┼────────────┼───────────┘
      │            │
      ▼            ▼
   GitHub       analytics.db
     API
```

## Technology Summary

```text
Framework
→ Next.js

Language
→ TypeScript

UI
→ Tailwind CSS

Database
→ SQLite

ORM
→ Drizzle ORM

Authentication
→ GitHub OAuth

API
→ GitHub REST API

Charts
→ Recharts

Architecture
→ Local-first modular monolith
```

---

# 36. Architectural Philosophy

Project ini **tidak membutuhkan arsitektur yang terlalu kompleks**.

Tidak perlu:

```text
❌ Microservices
❌ Kubernetes
❌ Kafka
❌ Redis
❌ Multiple databases
❌ Dedicated ML server
❌ Cloud database pada V1
```

Cukup:

```text
GitHub API
     ↓
Sync Engine
     ↓
SQLite
     ↓
Analytics
     ↓
Next.js
```

Sederhana di awal, tetapi memiliki boundary yang jelas sehingga dapat dikembangkan tanpa membongkar seluruh aplikasi.

> **Collect once. Store locally. Analyze repeatedly.**

GitHub menjadi sumber data, SQLite menjadi sumber data aplikasi, dan Analytics Engine menjadi lapisan yang mengubah histori aktivitas menjadi informasi yang berguna.
