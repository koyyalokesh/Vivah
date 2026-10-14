import argon2 from 'argon2';
import { describe, expect, it } from 'vitest';
import { AppError } from '../src/shared/app-error.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import type {
  PublicUser,
  SessionRecord,
  SessionRepository,
  UserRecord,
  UserRepository,
} from '../src/modules/auth/auth.types.js';

class MemoryUsers implements UserRepository {
  records: UserRecord[] = [];

  async findByEmail(emailNormalized: string) {
    return (
      this.records.find((user) => user.emailNormalized === emailNormalized) ??
      null
    );
  }

  async findById(id: string) {
    const user = this.records.find((record) => record.id === id);
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email };
  }

  async create(input: Omit<UserRecord, 'id'>): Promise<PublicUser> {
    const user = { id: String(this.records.length + 1), ...input };
    this.records.push(user);
    return { id: user.id, name: user.name, email: user.email };
  }

  async deleteById(id: string) {
    this.records = this.records.filter((user) => user.id !== id);
  }
}

class MemorySessions implements SessionRepository {
  records: SessionRecord[] = [];

  async create(input: Omit<SessionRecord, 'id'>) {
    this.records.push({ id: String(this.records.length + 1), ...input });
  }

  async findActiveByTokenHash(tokenHash: string, now: Date) {
    return (
      this.records.find(
        (session) =>
          session.tokenHash === tokenHash &&
          session.expiresAt.getTime() > now.getTime(),
      ) ?? null
    );
  }

  async deleteByTokenHash(tokenHash: string) {
    this.records = this.records.filter(
      (session) => session.tokenHash !== tokenHash,
    );
  }
}

describe('AuthService', () => {
  it('normalizes email, hashes the password, and stores only a session token hash', async () => {
    const users = new MemoryUsers();
    const sessions = new MemorySessions();
    const service = new AuthService(users, sessions, 7);

    const result = await service.signup({
      name: '  Asha Sharma  ',
      email: '  ASHA@example.com ',
      password: 'strong-password',
    });

    expect(result.user).toEqual({
      id: '1',
      name: 'Asha Sharma',
      email: 'ASHA@example.com',
    });
    expect(users.records[0]?.emailNormalized).toBe('asha@example.com');
    expect(
      await argon2.verify(users.records[0]!.passwordHash, 'strong-password'),
    ).toBe(true);
    expect(sessions.records[0]?.tokenHash).not.toBe(result.sessionToken);
    expect(sessions.records[0]?.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns one generic error for an unknown email or wrong password', async () => {
    const users = new MemoryUsers();
    const sessions = new MemorySessions();
    const service = new AuthService(users, sessions, 7);
    await service.signup({
      name: 'Asha Sharma',
      email: 'asha@example.com',
      password: 'strong-password',
    });

    for (const credentials of [
      { email: 'missing@example.com', password: 'strong-password' },
      { email: 'asha@example.com', password: 'wrong-password' },
    ]) {
      await expect(service.login(credentials)).rejects.toMatchObject<AppError>({
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }
  });

  it('removes a newly created user when session creation fails', async () => {
    const users = new MemoryUsers();
    const sessions = new MemorySessions();
    const sessionError = new Error('Session persistence failed');
    sessions.create = async () => {
      throw sessionError;
    };
    const service = new AuthService(users, sessions, 7);

    await expect(
      service.signup({
        name: 'Asha Sharma',
        email: 'asha@example.com',
        password: 'strong-password',
      }),
    ).rejects.toBe(sessionError);
    expect(users.records).toEqual([]);
  });

  it('rejects expired sessions and invalidates active sessions on logout', async () => {
    const users = new MemoryUsers();
    const sessions = new MemorySessions();
    const service = new AuthService(users, sessions, 7);
    const result = await service.signup({
      name: 'Asha Sharma',
      email: 'asha@example.com',
      password: 'strong-password',
    });

    expect(await service.authenticate(result.sessionToken)).toEqual(
      result.user,
    );
    sessions.records[0]!.expiresAt = new Date(0);
    expect(await service.authenticate(result.sessionToken)).toBeNull();
    sessions.records[0]!.expiresAt = new Date(Date.now() + 60_000);
    await service.logout(result.sessionToken);
    expect(await service.authenticate(result.sessionToken)).toBeNull();
  });
});
