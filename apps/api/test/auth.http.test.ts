import type { RequestHandler } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { AppError } from '../src/shared/app-error.js';
import type {
  AuthResult,
  AuthServiceContract,
  PublicUser,
} from '../src/modules/auth/auth.types.js';

const user: PublicUser = {
  id: 'user-1',
  name: 'Asha Sharma',
  email: 'asha@example.com',
};

class FakeAuthService implements AuthServiceContract {
  activeToken: string | undefined;

  async signup(): Promise<AuthResult> {
    this.activeToken = 'test-session-token';
    return {
      user,
      sessionToken: this.activeToken,
      expiresAt: new Date(Date.now() + 60_000),
    };
  }

  async login(input: { email: string; password: string }): Promise<AuthResult> {
    if (input.email !== user.email || input.password !== 'strong-password') {
      throw new AppError(
        401,
        'INVALID_CREDENTIALS',
        'Invalid email or password.',
      );
    }
    return this.signup();
  }

  async authenticate(token: string | undefined) {
    return token && token === this.activeToken ? user : null;
  }

  async logout() {
    this.activeToken = undefined;
  }
}

const databaseReady: RequestHandler = (_req, _res, next) => next();

function testApp(service = new FakeAuthService()) {
  return {
    service,
    app: createApp({
      service,
      databaseMiddleware: databaseReady,
      enableRateLimit: false,
    }),
  };
}

describe('authentication HTTP API', () => {
  it('creates an account and sets an HttpOnly same-site cookie', async () => {
    const { app } = testApp();
    const response = await request(app).post('/api/auth/signup').send({
      name: 'Asha Sharma',
      email: user.email,
      password: 'strong-password',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ data: { user, hasWedding: false } });
    expect(response.headers['set-cookie']?.[0]).toContain('vivah_session=');
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(response.headers['set-cookie']?.[0]).toContain('SameSite=Lax');
  });

  it('returns field errors for invalid signup data', async () => {
    const { app } = testApp();
    const response = await request(app)
      .post('/api/auth/signup')
      .send({ name: '', email: 'invalid', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toMatchObject({
      name: expect.any(Array),
      email: expect.any(Array),
      password: expect.any(Array),
    });
  });

  it('restores and then invalidates an authenticated session', async () => {
    const { app } = testApp();
    const agent = request.agent(app);
    await agent.post('/api/auth/signup').send({
      name: 'Asha Sharma',
      email: user.email,
      password: 'strong-password',
    });

    const current = await agent.get('/api/auth/me');
    expect(current.status).toBe(200);
    expect(current.headers['cache-control']).toBe('no-store');
    expect(current.body).toEqual({
      data: { user, membership: null, wedding: null },
    });

    expect((await agent.post('/api/auth/logout')).status).toBe(200);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });

  it('rejects a state-changing request from another origin', async () => {
    const { app } = testApp();
    const response = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://attacker.example')
      .send({ email: user.email, password: 'strong-password' });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('INVALID_ORIGIN');
  });
});
