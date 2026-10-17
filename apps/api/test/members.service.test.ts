import { describe, expect, it } from 'vitest';
import { AppError } from '../src/shared/app-error.js';
import { MemberService } from '../src/modules/members/members.service.js';
import type {
  InvitationRecord,
  MemberInvitationEmailSender,
  MemberRecord,
  MemberRepository,
  PublicInvitation,
} from '../src/modules/members/members.types.js';

const now = new Date('2026-10-17T00:00:00.000Z');
const admin: MemberRecord = {
  membershipId: '507f1f77bcf86cd799439011',
  user: { id: 'user-1', name: 'Asha', email: 'asha@example.com' },
  role: 'ADMIN',
  joinedAt: now,
};

class FakeRepository implements MemberRepository {
  actor: { weddingId: string; role: 'ADMIN' | 'MANAGER' } | null = {
    weddingId: 'wedding-1',
    role: 'ADMIN',
  };
  members = [admin];
  existingUser: { id: string } | null = null;
  createdInput: Parameters<MemberRepository['createInvitation']>[0] | null =
    null;
  roleResult: Awaited<ReturnType<MemberRepository['changeRole']>> = admin;
  removeResult: Awaited<ReturnType<MemberRepository['removeMember']>> =
    'REMOVED';
  async findActor() {
    return this.actor;
  }
  async listMembers() {
    return this.members;
  }
  async findUserByEmail() {
    return this.existingUser;
  }
  async hasMembership() {
    return Boolean(this.existingUser);
  }
  async findWeddingName() {
    return 'Asha & Ravi';
  }
  async revokeExpiredInvitation() {}
  async createInvitation(
    input: Parameters<MemberRepository['createInvitation']>[0],
  ) {
    this.createdInput = input;
    return {
      id: 'invite-1',
      status: 'PENDING',
      ...input,
    } satisfies InvitationRecord;
  }
  async revokeInvitation() {
    return true;
  }
  async listPendingInvitations() {
    return [];
  }
  async findPublicInvitation(): Promise<PublicInvitation | null> {
    return {
      email: 'member@example.com',
      role: 'MANAGER',
      requiresLogin: true,
      wedding: {
        brideName: 'Asha',
        groomName: 'Ravi',
        weddingDate: '2027-01-01',
      },
    };
  }
  async acceptInvitation() {
    return { weddingId: 'wedding-1', role: 'MANAGER' as const };
  }
  async changeRole() {
    return this.roleResult;
  }
  async removeMember() {
    return this.removeResult;
  }
}

class FakeEmail implements MemberInvitationEmailSender {
  sent: Parameters<MemberInvitationEmailSender['send']>[0] | null = null;
  async send(input: Parameters<MemberInvitationEmailSender['send']>[0]) {
    this.sent = input;
  }
}

function setup() {
  const repository = new FakeRepository();
  const email = new FakeEmail();
  return {
    repository,
    email,
    service: new MemberService(repository, email, () => now),
  };
}

describe('member service', () => {
  it('allows a Manager to read members but not manage them', async () => {
    const { repository, service } = setup();
    repository.actor = { weddingId: 'wedding-1', role: 'MANAGER' };
    await expect(service.listMembers('manager')).resolves.toEqual([admin]);
    await expect(
      service.invite(
        { id: 'manager', name: 'Maya' },
        { email: 'new@example.com', role: 'MANAGER' },
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('normalizes email, stores only a token hash and sends the raw link', async () => {
    const { repository, email, service } = setup();
    await service.invite(
      { id: 'user-1', name: 'Asha' },
      { email: ' New@Example.COM ', role: 'MANAGER' },
    );
    expect(repository.createdInput?.emailNormalized).toBe('new@example.com');
    expect(repository.createdInput?.tokenHash).toMatch(/^[a-f\d]{64}$/);
    expect(email.sent?.invitationUrl).toContain('/member-invitations/');
    expect(email.sent?.invitationUrl).not.toContain(
      repository.createdInput?.tokenHash ?? 'missing',
    );
  });

  it('rejects an email already belonging to this wedding', async () => {
    const { repository, service } = setup();
    repository.existingUser = { id: admin.user.id };
    await expect(
      service.invite(
        { id: 'user-1', name: 'Asha' },
        { email: 'ASHA@example.com', role: 'ADMIN' },
      ),
    ).rejects.toMatchObject({ code: 'ALREADY_HAS_WEDDING' });
  });

  it('reports final-Admin protection from atomic repository mutations', async () => {
    const { repository, service } = setup();
    repository.roleResult = 'LAST_ADMIN';
    await expect(
      service.changeRole('user-1', admin.membershipId, 'MANAGER'),
    ).rejects.toMatchObject({ code: 'LAST_ADMIN' });
    repository.removeResult = 'LAST_ADMIN';
    await expect(
      service.removeMember('user-1', admin.membershipId),
    ).rejects.toMatchObject({ code: 'LAST_ADMIN' });
  });

  it('returns NOT_FOUND without membership to avoid leaking another wedding', async () => {
    const { repository, service } = setup();
    repository.actor = null;
    await expect(service.listMembers('outsider')).rejects.toBeInstanceOf(
      AppError,
    );
    await expect(service.listMembers('outsider')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
