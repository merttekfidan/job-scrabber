/**
 * Typed API client for frontend. Uses credentials (cookies) for auth.
 * Base URL is relative so it works in browser and with extension.
 */

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const base = getBaseUrl();
  const pathOnly = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const baseForUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
  const url = baseForUrl ? new URL(pathOnly, baseForUrl) : new URL(pathOnly);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: T & { success?: boolean; error?: string };
  try {
    data = (text ? JSON.parse(text) : {}) as T & { success?: boolean; error?: string };
  } catch {
    throw new Error(res.statusText || 'Invalid JSON response');
  }

  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }
    if (res.status === 429) {
      const message = (data as { error?: string }).error ?? 'Too many requests. Please try again later.';
      throw new Error(message);
    }
    const message = (data as { error?: string }).error ?? res.statusText ?? 'Request failed';
    throw new Error(message);
  }

  return data as T;
}

const defaultHeaders: RequestInit['headers'] = {
  'Content-Type': 'application/json',
};

async function request<T>(
  method: string,
  path: string,
  options?: {
    params?: Record<string, string | number | undefined>;
    body?: unknown;
    headers?: RequestInit['headers'];
  }
): Promise<T> {
  const url = buildUrl(path, options?.params);
  const init: RequestInit = {
    method,
    credentials: 'include',
    headers: { ...defaultHeaders, ...options?.headers },
  };
  if (options?.body !== undefined && method !== 'GET') {
    init.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, init);
  return handleResponse<T>(res);
}

export const apiClient = {
  get<T>(path: string, options?: { params?: Record<string, string | number | undefined> }): Promise<T> {
    return request<T>('GET', path, options);
  },

  post<T>(path: string, body?: unknown, options?: Record<string, unknown>): Promise<T> {
    return request<T>('POST', path, { body, ...options });
  },

  put<T>(path: string, body?: unknown, options?: Record<string, unknown>): Promise<T> {
    return request<T>('PUT', path, { body, ...options });
  },

  delete<T>(path: string, options?: Record<string, unknown>): Promise<T> {
    return request<T>('DELETE', path, options);
  },
};
