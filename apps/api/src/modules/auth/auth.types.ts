export type PublicUser = {
  id: string;
  name: string;
  email: string;
};

export type UserRecord = PublicUser & {
  emailNormalized: string;
  passwordHash: string;
};

export type SessionRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export type AuthResult = {
  user: PublicUser;
  sessionToken: string;
  expiresAt: Date;
};

export type CurrentWeddingContext = {
  membership: {
    id: string;
    userId: string;
    weddingId: string;
    role: 'ADMIN' | 'MANAGER';
    joinedAt: Date;
  };
  wedding: {
    id: string;
    brideName: string;
    groomName: string;
    title: string;
    description?: string;
    weddingDate: string;
    timeZone: string;
    location?: { formattedAddress?: string };
    website: { slug: string; theme: string; isPublished: boolean };
    gallery: { isEnabled: boolean; guestUploadsEnabled: boolean };
    livestream: { youtubeUrl: string | null; isEnabled: boolean };
  };
};

export interface CurrentWeddingContextReader {
  getContextForUser(userId: string): Promise<CurrentWeddingContext | null>;
}

export interface UserRepository {
  findByEmail(emailNormalized: string): Promise<UserRecord | null>;
  findById(id: string): Promise<PublicUser | null>;
  create(input: {
    name: string;
    email: string;
    emailNormalized: string;
    passwordHash: string;
  }): Promise<PublicUser>;
  deleteById(id: string): Promise<void>;
}

export interface SessionRepository {
  create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  findActiveByTokenHash(
    tokenHash: string,
    now: Date,
  ): Promise<SessionRecord | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
}

export interface AuthServiceContract {
  signup(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResult>;
  login(input: { email: string; password: string }): Promise<AuthResult>;
  authenticate(token: string | undefined): Promise<PublicUser | null>;
  logout(token: string | undefined): Promise<void>;
}
