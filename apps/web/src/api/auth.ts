export type User = {
  id: string;
  name: string;
  email: string;
};

type AuthResponse = {
  data: { user: User; hasWedding: boolean };
};

type MeResponse = {
  data: { user: User; membership: null; wedding: null };
};

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string[]>;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiError(
      body.error?.message ?? 'Something went wrong. Please try again.',
      response.status,
      body.error?.details,
    );
  }

  return (await response.json()) as T;
}

export async function signup(input: {
  name: string;
  email: string;
  password: string;
}) {
  const response = await request<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data.user;
}

export async function login(input: { email: string; password: string }) {
  const response = await request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data.user;
}

export async function logout() {
  await request<{ success: true }>('/api/auth/logout', { method: 'POST' });
}

export async function getCurrentUser() {
  const response = await request<MeResponse>('/api/auth/me');
  return response.data.user;
}
