import type { RequestHandler } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type {
  AuthResult,
  AuthServiceContract,
  PublicUser,
} from '../src/modules/auth/auth.types.js';
import type {
  WeddingContext,
  WeddingServiceContract,
} from '../src/modules/wedding/wedding.types.js';

const user: PublicUser = {
  id: 'user-1',
  name: 'Asha Sharma',
  email: 'asha@example.com',
};

const context: WeddingContext = {
  membership: {
    id: 'membership-1',
    userId: user.id,
    weddingId: 'wedding-1',
    role: 'ADMIN',
    joinedAt: new Date('2026-10-14T00:00:00.000Z'),
  },
  wedding: {
    id: 'wedding-1',
    brideName: 'Asha',
    groomName: 'Rohan',
    title: 'Asha & Rohan’s Wedding',
    weddingDate: '2027-02-18',
    timeZone: 'Asia/Kolkata',
    location: { formattedAddress: 'Jaipur, Rajasthan' },
    website: {
      slug: 'asha-rohan-18022027',
      theme: 'classic',
      isPublished: false,
    },
    gallery: { isEnabled: false, guestUploadsEnabled: false },
    livestream: { youtubeUrl: null, isEnabled: false },
  },
};

class FakeAuthService implements AuthServiceContract {
  async signup(): Promise<AuthResult> {
    throw new Error('Not used.');
  }
  async login(): Promise<AuthResult> {
    throw new Error('Not used.');
  }
  async authenticate(token: string | undefined) {
    return token === 'valid-token' ? user : null;
  }
  async logout() {}
}

class FakeWeddingService implements WeddingServiceContract {
  receivedUserId: string | null = null;
  current: WeddingContext | null = null;

  async getContextForUser() {
    return this.current;
  }

  async createWedding(userId: string) {
    this.receivedUserId = userId;
    this.current = context;
    return context;
  }
}

const databaseReady: RequestHandler = (_req, _res, next) => next();

function testApp() {
  const weddingService = new FakeWeddingService();
  return {
    weddingService,
    app: createApp({
      service: new FakeAuthService(),
      weddingService,
      databaseMiddleware: databaseReady,
      enableRateLimit: false,
    }),
  };
}

describe('wedding HTTP API', () => {
  it('requires an authenticated session', async () => {
    const { app } = testApp();
    expect((await request(app).get('/api/wedding')).status).toBe(401);
    expect(
      (
        await request(app).post('/api/wedding').send({
          brideName: 'Asha',
          groomName: 'Rohan',
          title: 'Asha & Rohan',
          weddingDate: '2027-02-18',
          timeZone: 'Asia/Kolkata',
        })
      ).status,
    ).toBe(401);
  });

  it('creates from the session user and returns the wedding context', async () => {
    const { app, weddingService } = testApp();
    const response = await request(app)
      .post('/api/wedding')
      .set('Cookie', 'vivah_session=valid-token')
      .send({
        brideName: 'Asha',
        groomName: 'Rohan',
        title: 'Asha & Rohan’s Wedding',
        weddingDate: '2027-02-18',
        timeZone: 'Asia/Kolkata',
        location: { formattedAddress: 'Jaipur, Rajasthan' },
        userId: 'attacker-controlled-id',
      });

    expect(response.status).toBe(201);
    expect(weddingService.receivedUserId).toBe(user.id);
    expect(response.body.data.membership.role).toBe('ADMIN');
    expect(response.body.data.wedding.id).toBe('wedding-1');
  });

  it('validates date and time zone before creating a wedding', async () => {
    const { app } = testApp();
    const response = await request(app)
      .post('/api/wedding')
      .set('Cookie', 'vivah_session=valid-token')
      .send({
        brideName: 'Asha',
        groomName: 'Rohan',
        title: 'Asha & Rohan',
        weddingDate: '2027-02-30',
        timeZone: 'Invalid/Zone',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toMatchObject({
      weddingDate: expect.any(Array),
      timeZone: expect.any(Array),
    });
  });

  it('returns only the current authenticated user’s wedding', async () => {
    const { app, weddingService } = testApp();
    weddingService.current = context;
    const response = await request(app)
      .get('/api/wedding')
      .set('Cookie', 'vivah_session=valid-token');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toEqual({ data: context.wedding });
  });
});
