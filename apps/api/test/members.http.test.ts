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
  MemberRecord,
  MemberServiceContract,
} from '../src/modules/members/members.types.js';
import type { WeddingServiceContract } from '../src/modules/wedding/wedding.types.js';

const user: PublicUser = {
  id: 'user-1',
  name: 'Asha',
  email: 'asha@example.com',
};
const member: MemberRecord = {
  membershipId: '507f1f77bcf86cd799439011',
  user,
  role: 'ADMIN',
  joinedAt: new Date(),
};
class Auth implements AuthServiceContract {
  async signup(): Promise<AuthResult> {
    throw new Error('unused');
  }
  async login(): Promise<AuthResult> {
    throw new Error('unused');
  }
  async authenticate(token: string | undefined) {
    return token === 'valid' ? user : null;
  }
  async logout() {}
}
class Members implements MemberServiceContract {
  invited: unknown = null;
  async listMembers() {
    return [member];
  }
  async invite(
    actor: PublicUser,
    input: { email: string; role: 'ADMIN' | 'MANAGER' },
  ) {
    this.invited = { actor, input };
    return {
      id: 'invite',
      weddingId: 'wedding',
      email: input.email,
      emailNormalized: input.email,
      role: input.role,
      status: 'PENDING' as const,
      expiresAt: new Date(),
    };
  }
  async listInvitations() {
    return [];
  }
  async revokeInvitation() {}
  async getPublicInvitation() {
    return {
      email: 'new@example.com',
      role: 'MANAGER' as const,
      requiresLogin: true as const,
      wedding: {
        brideName: 'Asha',
        groomName: 'Ravi',
        weddingDate: '2027-01-01',
      },
    };
  }
  async acceptInvitation() {
    return { weddingId: 'wedding', role: 'MANAGER' as const };
  }
  async changeRole() {
    return member;
  }
  async removeMember() {}
}
const wedding = {} as WeddingServiceContract;
const database: RequestHandler = (_req, _res, next) => next();
function setup() {
  const members = new Members();
  return {
    members,
    app: createApp({
      service: new Auth(),
      weddingService: wedding,
      memberService: members,
      databaseMiddleware: database,
      enableRateLimit: false,
    }),
  };
}

describe('members HTTP API', () => {
  it('requires authentication for the member list', async () => {
    expect((await request(setup().app).get('/api/members')).status).toBe(401);
  });
  it('validates invites and derives the actor from the session', async () => {
    const { app, members } = setup();
    const response = await request(app)
      .post('/api/members/invitations')
      .set('Cookie', 'vivah_session=valid')
      .send({
        email: ' new@example.com ',
        role: 'MANAGER',
        userId: 'attacker',
      });
    expect(response.status).toBe(201);
    expect(members.invited).toEqual({
      actor: user,
      input: { email: 'new@example.com', role: 'MANAGER' },
    });
    expect(response.body.data).toEqual({
      id: 'invite',
      email: 'new@example.com',
      role: 'MANAGER',
      status: 'PENDING',
      expiresAt: expect.any(String),
    });
    expect(response.body.data).not.toHaveProperty('weddingId');
    expect(response.body.data).not.toHaveProperty('emailNormalized');
    expect(
      (
        await request(app)
          .post('/api/members/invitations')
          .set('Cookie', 'vivah_session=valid')
          .send({ email: 'bad', role: 'OWNER' })
      ).status,
    ).toBe(400);
  });
  it('rejects cross-origin member mutations', async () => {
    const response = await request(setup().app)
      .delete(`/api/members/${member.membershipId}`)
      .set('Cookie', 'vivah_session=valid')
      .set('Origin', 'https://attacker.example');
    expect(response.status).toBe(403);
  });
  it('exposes safe invitation details publicly and requires auth to accept', async () => {
    const token = 'a'.repeat(43);
    const preview = await request(setup().app).get(
      `/api/public/member-invitations/${token}`,
    );
    expect(preview.status).toBe(200);
    expect(preview.body.data).not.toHaveProperty('tokenHash');
    expect(
      (
        await request(setup().app).post(
          `/api/member-invitations/${token}/accept`,
        )
      ).status,
    ).toBe(401);
  });
});
