const API_URL = process.env.GITHUB_API_URL ?? "https://api.github.com";

export class GithubRateLimitError extends Error {
  readonly resetAt: Date;

  constructor(resetAt: Date) {
    super(`GitHub API rate limit reached. Resets at ${resetAt.toISOString()}`);
    this.name = "GithubRateLimitError";
    this.resetAt = resetAt;
  }
}

export class GithubApiError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(status: number, url: string, message?: string) {
    super(message ?? `GitHub API error ${status} on ${url}`);
    this.name = "GithubApiError";
    this.status = status;
    this.url = url;
  }
}

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  resetAt: Date | null;
}

export interface RequestOptions {
  method?: "GET" | "POST";
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

interface ResponseMeta {
  data: unknown;
  status: number;
  rateLimit: RateLimitStatus;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(
  token: string,
  path: string,
  options: RequestOptions = {},
): Promise<ResponseMeta> {
  const url = buildUrl(path, options.params);
  const maxRetries = 3;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await sleep(Math.min(1000 * 2 ** (attempt - 1), 8000));
    }

    let response: globalThis.Response;
    try {
      response = await fetch(url, {
        method: options.method ?? "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(options.body !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        cache: "no-store",
      });
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Network request failed");
      continue;
    }

    if (response.status === 403 || response.status === 429) {
      const remaining = response.headers.get("x-ratelimit-remaining");
      if (remaining === "0") {
        const resetHeader = response.headers.get("x-ratelimit-reset");
        const resetAt = resetHeader
          ? new Date(Number(resetHeader) * 1000)
          : new Date(Date.now() + 60 * 60 * 1000);
        throw new GithubRateLimitError(resetAt);
      }
      lastError = new GithubApiError(response.status, url);
      continue;
    }

    if (!response.ok) {
      // Retry only on transient server errors
      if (response.status >= 500) {
        lastError = new GithubApiError(response.status, url);
        continue;
      }
      let message: string | undefined;
      try {
        message = ((await response.json()) as { message?: string }).message;
      } catch {
        // ignore body parse failure
      }
      throw new GithubApiError(response.status, url, message);
    }

    return {
      data: await response.json(),
      status: response.status,
      rateLimit: {
        limit: Number(response.headers.get("x-ratelimit-limit") ?? 0),
        remaining: Number(response.headers.get("x-ratelimit-remaining") ?? 0),
        resetAt: response.headers.get("x-ratelimit-reset")
          ? new Date(
              Number(response.headers.get("x-ratelimit-reset")) * 1000,
            )
          : null,
      },
    };
  }

  throw lastError ?? new GithubApiError(0, url);
}

export async function githubRequest<T>(
  token: string,
  path: string,
  options?: RequestOptions,
): Promise<T> {
  return (await request(token, path, options)).data as T;
}

export async function getRateLimitStatus(
  token: string,
): Promise<RateLimitStatus> {
  const meta = await request(token, "/rate_limit");
  return meta.rateLimit;
}

export async function paginate<T>(
  token: string,
  path: string,
  options: RequestOptions & {
    maxPages?: number;
    stopWhen?: (item: T) => boolean;
  } = {},
): Promise<T[]> {
  const { maxPages = 500, stopWhen, ...restOptions } = options;
  const perPage = 100;
  const results: T[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const data = await githubRequest<T[]>(token, path, {
      ...restOptions,
      params: { ...restOptions.params, per_page: perPage, page },
    });

    let shouldStop = false;
    for (const item of data) {
      results.push(item);
      if (stopWhen?.(item)) {
        shouldStop = true;
      }
    }

    if (shouldStop || data.length < perPage) break;
  }

  return results;
}
