export interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GithubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  size: number;
  open_issues_count: number;
  private: boolean;
  fork: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  owner: {
    id: number;
    login: string;
  };
}

export interface GithubCommitListItem {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string | null;
      email: string | null;
      date: string;
    } | null;
    committer: {
      name: string | null;
      email: string | null;
      date: string;
    } | null;
  };
  author: {
    login: string | null;
  } | null;
  committer: {
    login: string | null;
  } | null;
}

export interface GithubCommitDetail extends GithubCommitListItem {
  stats: {
    additions: number;
    deletions: number;
    total: number;
  } | null;
  files?: Array<Record<string, unknown>>;
}

export interface GithubPullRequest {
  id: number;
  number: number;
  title: string | null;
  state: "open" | "closed";
  merged_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  additions: number | null;
  deletions: number | null;
  changed_files: number | null;
  comments: number;
  html_url: string;
  draft?: boolean;
  user: {
    login: string | null;
  } | null;
}

export interface GithubReview {
  id: number;
  state: string;
  body: string | null;
  submitted_at: string | null;
  user: {
    login: string | null;
  } | null;
}

export interface GithubIssue {
  id: number;
  number: number;
  title: string | null;
  state: "open" | "closed" | "all";
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  comments: number;
  html_url: string;
  pull_request?: Record<string, unknown>;
  user: {
    login: string | null;
  } | null;
  labels: Array<{
    name: string;
    color: string | null;
  }>;
}

export interface GithubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  created_at: string | null;
  published_at: string | null;
  prerelease: boolean;
  draft: boolean;
  author: {
    login: string | null;
  } | null;
}
