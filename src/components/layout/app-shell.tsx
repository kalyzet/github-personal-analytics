"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Code2,
  FolderGit2,
  GitPullRequestArrow,
  LayoutDashboard,
  Menu,
  RefreshCw,
  X,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Analytics",
    items: [
      { href: "/activity", label: "Activity", icon: Activity },
      { href: "/commits", label: "Commits", icon: Code2 },
      { href: "/pull-requests", label: "Pull Requests", icon: GitPullRequestArrow },
      { href: "/technologies", label: "Technologies", icon: Code2 },
    ],
  },
  {
    label: "Projects",
    items: [
      { href: "/repositories", label: "Repositories", icon: FolderGit2 },
    ],
  },
  {
    label: "System",
    items: [{ href: "/sync", label: "Sync", icon: RefreshCw }],
  },
];

export default function AppShell({
  username,
  avatarUrl,
  children,
}: {
  username: string;
  avatarUrl?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-accent/15 font-medium text-text-primary"
                        : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    }`}
                  >
                    <Icon
                      size={16}
                      className={active ? "text-accent" : "text-text-muted"}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="fixed hidden h-screen w-[240px] flex-col border-r border-border-default bg-surface p-4 md:flex">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-3 pt-1">
          <span className="text-lg text-accent">◈</span>
          <span className="text-sm font-bold tracking-tight">
            GitHub Analytics
          </span>
        </Link>
        {nav}
        <div className="mt-auto flex items-center gap-2 rounded-lg bg-surface-elevated p-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={`@${username}`}
              className="h-7 w-7 rounded-full"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-xs text-accent">
              {username.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-text-primary">
              @{username}
            </p>
            <a
              href="/api/auth/github/logout"
              className="text-[10px] text-text-muted hover:text-danger"
            >
              Logout
            </a>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:ml-[240px]">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border-default bg-background/90 px-5 backdrop-blur md:px-8">
          <button
            className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
          >
            <Menu size={18} />
          </button>
          <span className="hidden text-sm font-semibold md:block">
            Developer Observatory
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/sync"
              className="flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
            >
              <RefreshCw size={13} />
              Sync
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-6 md:px-8">
          {children}
        </main>

        <nav className="sticky bottom-0 z-10 flex justify-around border-t border-border-default bg-surface/95 py-2 backdrop-blur md:hidden">
          {[
            { href: "/dashboard", label: "Home" },
            { href: "/activity", label: "Activity" },
            { href: "/repositories", label: "Projects" },
            { href: "/sync", label: "Sync" },
          ].map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1 text-xs ${
                  active ? "font-medium text-accent" : "text-text-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 border-r border-border-default bg-surface p-4">
            <div className="mb-8 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold">
                <span className="text-lg text-accent">◈</span> GitHub Analytics
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-hover"
                aria-label="Tutup menu"
              >
                <X size={16} />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}
    </div>
  );
}
