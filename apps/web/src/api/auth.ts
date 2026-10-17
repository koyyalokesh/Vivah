export type User = {
  id: string;
  name: string;
  email: string;
};

export type WeddingMembership = {
  id: string;
  userId: string;
  weddingId: string;
  role: 'ADMIN' | 'MANAGER';
  joinedAt: string;
};

export type Wedding = {
  id: string;
  brideName: string;
  groomName: string;
  title?: string;
  description?: string;
  weddingDate: string;
  timeZone: string;
  location?: { formattedAddress?: string };
  website: { slug: string; theme: string; isPublished: boolean };
  gallery: { isEnabled: boolean; guestUploadsEnabled: boolean };
  livestream: { youtubeUrl: string | null; isEnabled: boolean };
};

export type AuthSession = {
  user: User;
  membership: WeddingMembership | null;
  wedding: Wedding | null;
};

type AuthResponse = {
  data: AuthSession & { hasWedding: boolean };
};

type MeResponse = {
  data: AuthSession;
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

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
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

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export async function signup(input: {
  name: string;
  email: string;
  password: string;
}) {
  const response = await apiRequest<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function login(input: { email: string; password: string }) {
  const response = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function logout() {
  await apiRequest<{ success: true }>('/api/auth/logout', { method: 'POST' });
}

export async function getCurrentSession() {
  const response = await apiRequest<MeResponse>('/api/auth/me');
  return response.data;
}
