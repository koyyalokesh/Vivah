import argon2, { type HashOptions } from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { config } from '../../config.js';
import { AppError } from '../../shared/app-error.js';
import {
  MongooseSessionRepository,
  MongooseUserRepository,
} from './auth.repository.js';
import type {
  AuthResult,
  AuthServiceContract,
  SessionRepository,
  UserRepository,
} from './auth.types.js';

const passwordOptions = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} satisfies HashOptions;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function isDuplicateKey(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

export class AuthService implements AuthServiceContract {
  private dummyPasswordHash: Promise<string> | undefined;

  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly sessionDurationDays = config.SESSION_DURATION_DAYS,
  ) {}

  async signup(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const emailNormalized = normalizeEmail(input.email);
    if (await this.users.findByEmail(emailNormalized)) {
      throw new AppError(
        409,
        'EMAIL_ALREADY_EXISTS',
        'An account with this email already exists.',
      );
    }

    const passwordHash = await argon2.hash(input.password, passwordOptions);

    let user;
    try {
      user = await this.users.create({
        name: input.name.trim(),
        email: input.email.trim(),
        emailNormalized,
        passwordHash,
      });
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new AppError(
          409,
          'EMAIL_ALREADY_EXISTS',
          'An account with this email already exists.',
        );
      }
      throw error;
    }

    try {
      return await this.createSession(user);
    } catch (error) {
      await this.users.deleteById(user.id);
      throw error;
    }
  }

  async login(input: { email: string; password: string }): Promise<AuthResult> {
    const user = await this.users.findByEmail(normalizeEmail(input.email));
    const hash = user?.passwordHash ?? (await this.getDummyPasswordHash());
    const passwordMatches = await argon2.verify(hash, input.password);

    if (!user || !passwordMatches) {
      throw new AppError(
        401,
        'INVALID_CREDENTIALS',
        'Invalid email or password.',
      );
    }

    return this.createSession(user);
  }

  async authenticate(token: string | undefined) {
    if (!token) return null;

    const session = await this.sessions.findActiveByTokenHash(
      hashSessionToken(token),
      new Date(),
    );
    if (!session) return null;

    return this.users.findById(session.userId);
  }

  async logout(token: string | undefined) {
    if (token) {
      await this.sessions.deleteByTokenHash(hashSessionToken(token));
    }
  }

  private async createSession(user: {
    id: string;
    name: string;
    email: string;
  }): Promise<AuthResult> {
    const sessionToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + this.sessionDurationDays * 24 * 60 * 60 * 1000,
    );
    await this.sessions.create({
      userId: user.id,
      tokenHash: hashSessionToken(sessionToken),
      expiresAt,
    });
    return { user, sessionToken, expiresAt };
  }

  private getDummyPasswordHash() {
    this.dummyPasswordHash ??= argon2.hash(
      randomBytes(32).toString('base64url'),
      passwordOptions,
    );
    return this.dummyPasswordHash;
  }
}

export const authService = new AuthService(
  new MongooseUserRepository(),
  new MongooseSessionRepository(),
);
