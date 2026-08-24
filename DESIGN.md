# GitHub Personal Analytics — Design System

## 1. Design Direction

### Concept

**Developer Observatory**

Aplikasi terasa seperti pusat observasi pribadi untuk memantau perkembangan aktivitas coding menggunakan Bahasa Indonesia.

Visual harus memberikan kesan:

- Technical
- Analytical
- Modern
- Clean
- Data-driven
- Slightly futuristic
- Professional

Bukan seperti dashboard enterprise yang kaku.

Bukan juga seperti GitHub clone.

### Design Keywords

```text
Developer
Analytics
Observatory
Data
Timeline
Growth
Activity
Intelligence
```

---

# 2. Visual Style

## Overall Style

Gunakan **dark-first dashboard**.

Karakter visual:

- Background gelap.
- Surface sedikit lebih terang.
- Border tipis.
- Radius medium.
- Typography tegas.
- Chart menjadi elemen visual utama.
- Accent digunakan secara hemat.

UI harus terasa seperti:

```text
GitHub
   +
Linear
   +
Vercel
   +
Developer Analytics
```

---

# 3. Color System

## Background

```text
Background:
#09090B

Surface:
#111113

Surface Elevated:
#18181B

Surface Hover:
#1F1F23
```

## Borders

```text
Border:
#27272A

Border Strong:
#3F3F46
```

## Text

```text
Primary:
#FAFAFA

Secondary:
#A1A1AA

Muted:
#71717A
```

## Accent

Primary accent:

```text
#8B5CF6
```

Secondary accent:

```text
#06B6D4
```

Positive:

```text
#22C55E
```

Warning:

```text
#F59E0B
```

Danger:

```text
#EF4444
```

Accent colors tidak boleh digunakan pada seluruh UI.

Gunakan hanya untuk:

- Active state
- Important metric
- Chart highlights
- Progress
- Status
- CTA

---

# 4. Typography

Gunakan:

```text
Primary:
Inter

Monospace:
JetBrains Mono
```

## Scale

```text
Display:
32px / 700

Page Title:
24px / 700

Section Title:
18px / 600

Card Title:
14px / 600

Body:
14px / 400

Small:
12px / 400

Metric:
28–36px / 700
```

Angka statistik dapat menggunakan monospace untuk memberikan kesan technical.

---

# 5. Layout

Desktop menggunakan sidebar.

```text
┌──────────────┬─────────────────────────────────────┐
│              │                                     │
│   SIDEBAR    │              CONTENT                │
│              │                                     │
│              │                                     │
│              │                                     │
│              │                                     │
└──────────────┴─────────────────────────────────────┘
```

Sidebar:

```text
Width: 240px
```

Content:

```text
max-width: 1440px
padding: 24–32px
```

---

# 6. Sidebar

## Header

```text
◈ GitHub Analytics
```

atau:

```text
◉ Dev Observatory
```

## Navigation

```text
Overview

Analytics
├── Activity
├── Commits
├── Pull Requests
├── Collaboration
└── Technologies

Projects
├── Repositories
└── Project Health

Insights
├── Insights
└── Milestones

System
├── Sync
└── Settings
```

## Active Navigation

Active item menggunakan:

- Accent background tipis.
- Accent icon.
- Primary text.

Contoh:

```text
┌─────────────────────┐
│ ◉  Activity         │
└─────────────────────┘
```

---

# 7. Topbar

Topbar minimal.

```text
┌──────────────────────────────────────────────┐
│ Activity                     🔄 Sync   👤    │
└──────────────────────────────────────────────┘
```

Elements:

- Page title.
- Date range.
- Sync status.
- User avatar.

---

# 8. Dashboard

Dashboard adalah halaman paling penting.

## Layout

```text
┌──────────────────────────────────────────────┐
│ Overview                         Last 30 days│
├──────────────────────────────────────────────┤
│ Commits │ PR │ Issues │ Active Days │ Streak│
├──────────────────────────────────────────────┤
│                                              │
│              Activity Heatmap               │
│                                              │
├─────────────────────────┬────────────────────┤
│ Activity Trend          │ Developer Score    │
│                         │                    │
├─────────────────────────┼────────────────────┤
│ Top Repositories        │ Languages          │
│                         │                    │
├─────────────────────────┴────────────────────┤
│ Latest Insights                              │
└──────────────────────────────────────────────┘
```

---

# 9. Metric Cards

Metric card harus sederhana.

```text
┌────────────────────────┐
│ COMMITS                │
│                        │
│ 528                    │
│ ↑ 18.4%                │
│                        │
│ vs previous period     │
└────────────────────────┘
```

Anatomy:

```text
Label
Metric
Change
Context
```

Jangan menggunakan terlalu banyak icon.

---

# 10. Developer Score Card

Developer Score menjadi card khusus.

```text
┌─────────────────────────────┐
│ DEVELOPER SCORE             │
│                             │
│          87                 │
│        / 100                │
│                             │
│ Activity       █████████ 91  │
│ Consistency    █████████ 94  │
│ Collaboration  ███████   72  │
│ Projects       ████████  84  │
└─────────────────────────────┘
```

Score harus selalu memiliki tooltip:

> Score adalah indikator aktivitas berdasarkan histori GitHub, bukan ukuran kemampuan programming.

---

# 11. Activity Heatmap

Heatmap menjadi salah satu visual utama.

```text
         Mon Tue Wed Thu Fri Sat Sun

Week 1    ░   ░   ▓   ▓   █   ░   ░
Week 2    ▓   ▓   █   █   █   ▓   ░
Week 3    ░   ▓   ▓   █   █   █   ▓
Week 4    ▓   █   █   ▓   ░   ░   ▓
```

Hover menampilkan:

```text
August 24, 2026

12 activities

8 commits
2 PRs
1 issue
1 review
```

---

# 12. Activity Trend

Gunakan line/area chart.

```text
Activity
│
│          ╭──╮
│     ╭────╯  ╰──╮
│ ────╯           ╰────
│
└────────────────────────
     Week 1   Week 2
```

Controls:

```text
7D
30D
90D
1Y
```

---

# 13. Repository Ranking

Repository ditampilkan sebagai ranked list.

```text
┌────────────────────────────────────┐
│ TOP REPOSITORIES                   │
│                                    │
│ 01  PKL Tracker          38%       │
│     142 commits                    │
│                                    │
│ 02  Power Predictor      23%       │
│     87 commits                     │
│                                    │
│ 03  Human War            17%       │
│     64 commits                     │
└────────────────────────────────────┘
```

Gunakan progress bar kecil.

---

# 14. Language Analytics

Donut chart atau horizontal bar.

```text
TypeScript    ███████████████ 42%
Python        █████████        27%
JavaScript    █████             16%
PHP           ███                9%
Other         ██                 6%
```

Tambahkan trend:

```text
TypeScript
↑ +8% from previous period
```

---

# 15. Activity Page

Halaman khusus aktivitas.

```text
┌─────────────────────────────────────────────┐
│ Activity                                    │
│                                             │
│ [30 Days ▼] [All Repositories ▼]            │
├─────────────────────────────────────────────┤
│                                             │
│ Activity Timeline                           │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ Activity Heatmap                            │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│ Activity Breakdown                          │
│                                             │
└─────────────────────────────────────────────┘
```

---

# 16. Commit Page

Commit analytics fokus pada volume dan pattern.

Cards:

```text
Total Commits
Average / Day
Additions
Deletions
Average Commit Size
```

Charts:

```text
Commit Trend
Commit Distribution
Commit Size
Commit Time
Repository Distribution
```

---

# 17. Pull Request Page

Layout:

```text
┌────────────┬────────────┬────────────┐
│ Total PR   │ Merged     │ Merge Rate │
└────────────┴────────────┴────────────┘

┌───────────────────────────────────────┐
│ PR Trend                              │
└───────────────────────────────────────┘

┌─────────────────────┬─────────────────┐
│ PR Lifetime         │ PR Size         │
└─────────────────────┴─────────────────┘
```

---

# 18. Collaboration Page

Fokus pada interaksi.

Visual:

```text
PR Created
PR Reviewed
Issues
Comments
Contributors
```

Gunakan relationship-style visualization jika diperlukan.

Namun V1 tetap menggunakan chart sederhana.

---

# 19. Repository Page

Repository ditampilkan sebagai cards/list.

```text
┌──────────────────────────────────────┐
│ PKL Tracker                           │
│ TypeScript · Next.js                  │
│                                       │
│ ⭐ 0   Fork 0                         │
│                                       │
│ Activity       ███████████ 38%        │
│                                       │
│ Last active: Today                    │
└──────────────────────────────────────┘
```

Status badge:

```text
● Active
● Low Activity
● Inactive
● Archived
```

---

# 20. Repository Detail

Header:

```text
PKL Tracker

TypeScript · Next.js · Supabase

⭐ 0   Forks 0   Issues 3
```

Tabs:

```text
Overview
Activity
Commits
Pull Requests
Issues
Languages
```

---

# 21. Insights Page

Insight menggunakan card.

```text
┌─────────────────────────────────────┐
│ ↑ ACTIVITY INCREASE                 │
│                                     │
│ Your activity increased by 23%      │
│ compared with the previous period. │
│                                     │
│ 30D → 37D active activities         │
└─────────────────────────────────────┘
```

Insight categories:

```text
Activity
Consistency
Projects
Technology
Collaboration
Milestone
```

---

# 22. Milestones

Gunakan timeline.

```text
2026
 │
 ├── 🎯 100 Commits
 │
 ├── 🎯 250 Commits
 │
 ├── 🔥 30 Day Streak
 │
 └── 🎯 500 Commits
```

Milestone card dapat memiliki timestamp.

---

# 23. Sync Page

```text
┌───────────────────────────────────────┐
│ GitHub Sync                           │
│                                       │
│ Last sync                             │
│ 5 minutes ago                         │
│                                       │
│ ✓ Connected                           │
│                                       │
│ [ Sync Now ]                          │
└───────────────────────────────────────┘
```

Sync progress:

```text
Syncing repositories...

████████████████░░░░ 82%

Repositories      ✓
Commits           ✓
Pull Requests     ✓
Issues            ...
Reviews           ...
```

---

# 24. Sync History

Timeline/table:

```text
Time        Status       New Data
14:30       ✓ Success    +12 commits
12:00       ✓ Success    +3 PR
Yesterday   ✓ Success    +27 commits
```

---

# 25. Settings

Sections:

```text
Account
GitHub Connection
Analytics
Privacy
Data
Appearance
```

Danger Zone:

```text
Disconnect GitHub
Delete Analytics Data
Delete Account
```

Delete actions harus menggunakan confirmation modal.

---

# 26. Empty States

Jangan menampilkan chart kosong.

Contoh:

```text
┌────────────────────────────────────┐
│                                    │
│             ◈                      │
│                                    │
│       No activity yet              │
│                                    │
│ Connect your GitHub account to     │
│ start collecting analytics.        │
│                                    │
│       [ Connect GitHub ]           │
│                                    │
└────────────────────────────────────┘
```

---

# 27. Loading States

Gunakan skeleton.

```text
┌─────────────────────────┐
│ █████████               │
│                         │
│ ███████████████         │
│                         │
│ ████████                │
└─────────────────────────┘
```

Hindari spinner besar di seluruh halaman.

---

# 28. Error States

Error harus informatif.

Contoh:

```text
GitHub sync failed

GitHub API rate limit reached.

Next retry:
14 minutes

[ Try Again ]
```

Jangan hanya menampilkan:

```text
Error 500
```

---

# 29. Toast

Toast digunakan untuk action feedback.

Success:

```text
✓ GitHub data synchronized
```

Error:

```text
× Synchronization failed
```

Info:

```text
i Analytics updated
```

Toast tidak boleh menghalangi konten.

---

# 30. Modal

Gunakan modal untuk:

- Delete data.
- Disconnect GitHub.
- Detail metric.
- Sync configuration.

Modal harus memiliki:

```text
Title
Description
Action
Cancel
```

---

# 31. Responsive Design

## Desktop

Sidebar penuh.

```text
240px sidebar
+
content
```

## Tablet

Sidebar dapat diperkecil.

```text
72px sidebar
```

## Mobile

Sidebar berubah menjadi bottom navigation atau drawer.

Navigation utama:

```text
Home
Activity
Projects
Insights
More
```

---

# 32. Mobile Dashboard

Prioritas:

```text
Developer Score
↓
Key Metrics
↓
Activity Trend
↓
Heatmap
↓
Repositories
↓
Insights
```

Jangan memaksakan desktop grid ke mobile.

---

# 33. Interaction Principles

### Principle 1 — Information Hierarchy

Metric penting harus terlihat dalam 1–2 detik.

### Principle 2 — Progressive Disclosure

Detail hanya muncul ketika pengguna membutuhkannya.

### Principle 3 — Data First

Chart harus membantu memahami data, bukan hanya dekorasi.

### Principle 4 — Consistency

Spacing, radius, typography, dan card behavior harus konsisten.

### Principle 5 — Explainability

Setiap metric penting harus dapat dijelaskan sumber datanya.

---

# 34. Card System

Default card:

```text
background: Surface
border: 1px solid Border
radius: 12px
padding: 20px
```

Card hover:

```text
background → Surface Hover
border → Border Strong
```

Gunakan elevation seminimal mungkin.

---

# 35. Border Radius

```text
Button: 8px
Input: 8px
Card: 12px
Modal: 16px
Badge: 999px
```

---

# 36. Spacing

Gunakan spacing scale:

```text
4
8
12
16
20
24
32
40
48
64
```

Default page gap:

```text
24px
```

---

# 37. Iconography

Gunakan icon set konsisten.

Recommended:

```text
Lucide Icons
```

Icon style:

- Outline.
- Simple.
- 16–20px.
- Tidak menggunakan icon berlebihan.

---

# 38. Charts

Chart harus:

- Memiliki tooltip.
- Memiliki legend jika diperlukan.
- Tidak menggunakan terlalu banyak warna.
- Menggunakan accent secara konsisten.
- Memiliki empty state.
- Memiliki responsive behavior.

Tooltip:

```text
Aug 24

Commits       8
PR            2
Issues        1
Reviews       1
```

---

# 39. Data Density

Dashboard harus terasa **dense tetapi tidak sesak**.

Target:

```text
Information Density:
Medium–High
```

Jangan membuat setiap metric menjadi card besar.

Gunakan:

- compact cards
- tables
- charts
- inline statistics

---

# 40. Motion

Animation harus subtle.

Durasi:

```text
100–200ms
```

Gunakan untuk:

- Hover.
- Modal.
- Dropdown.
- Sidebar.
- Chart transition.
- Toast.

Jangan menggunakan animasi berlebihan.

---

# 41. Accessibility

Requirements:

- Keyboard navigation.
- Focus state.
- Semantic HTML.
- Sufficient contrast.
- Accessible chart labels.
- Tooltip tidak menjadi satu-satunya sumber informasi.
- Status tidak hanya dibedakan berdasarkan warna.

---

# 42. Visual Personality

Aplikasi boleh memiliki sedikit personality.

Contoh copy:

```text
Your development radar is clear.

You're on a 23-day streak.

This month looks productive.

One repository is getting most of your attention.
```

Namun jangan menggunakan bahasa terlalu gamified.

---

# 43. Dashboard Priority

Urutan informasi:

```text
1. Current State
2. Activity
3. Trends
4. Projects
5. Technologies
6. Insights
```

User harus bisa memahami kondisi development hanya dengan melihat dashboard selama beberapa detik.

---

# 44. Design Goal

Desain akhir harus memberikan perasaan:

> "Ini bukan sekadar statistik GitHub. Ini seperti melihat dashboard observasi perkembangan diri gue sebagai developer."

Visual harus terasa:

```text
Technical
     +
Personal
     +
Analytical
     +
Minimal
```

dan bukan:

```text
Corporate Dashboard
        ❌
Generic Admin Panel
        ❌
GitHub Clone
        ❌
Overly Gamified App
        ❌
```
