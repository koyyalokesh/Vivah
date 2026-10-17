import { createHmac, randomBytes } from 'node:crypto';
import { config } from '../../config.js';
import { AppError } from '../../shared/app-error.js';
import { ResendMemberInvitationEmailSender } from './member-invitation.email.js';
import { MongooseMemberRepository } from './members.repository.js';
import type {
  MemberInvitationEmailSender,
  MemberRepository,
  MemberServiceContract,
} from './members.types.js';

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function tokenHash(token: string) {
  return createHmac('sha256', config.MEMBER_INVITATION_HMAC_SECRET)
    .update(token)
    .digest('hex');
}

function duplicateKey(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

export class MemberService implements MemberServiceContract {
  constructor(
    private readonly members: MemberRepository,
    private readonly emails: MemberInvitationEmailSender,
    private readonly now = () => new Date(),
  ) {}

  private async actor(userId: string, adminOnly = false) {
    const actor = await this.members.findActor(userId);
    if (!actor)
      throw new AppError(404, 'NOT_FOUND', 'Wedding members were not found.');
    if (adminOnly && actor.role !== 'ADMIN')
      throw new AppError(
        403,
        'FORBIDDEN',
        'Only an Admin can manage wedding members.',
      );
    return actor;
  }

  async listMembers(userId: string) {
    return this.members.listMembers((await this.actor(userId)).weddingId);
  }

  async invite(
    user: { id: string; name: string },
    input: { email: string; role: 'ADMIN' | 'MANAGER' },
  ) {
    const actor = await this.actor(user.id, true);
    const emailNormalized = normalizeEmail(input.email);
    const existingUser = await this.members.findUserByEmail(emailNormalized);
    if (existingUser && (await this.members.hasMembership(existingUser.id))) {
      throw new AppError(
        409,
        'ALREADY_HAS_WEDDING',
        'This person already belongs to a wedding.',
      );
    }
    const now = this.now();
    await this.members.revokeExpiredInvitation(
      actor.weddingId,
      emailNormalized,
      now,
    );
    const rawToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      now.getTime() + config.MEMBER_INVITATION_DURATION_DAYS * 86_400_000,
    );
    let created;
    try {
      created = await this.members.createInvitation({
        weddingId: actor.weddingId,
        email: input.email.trim(),
        emailNormalized,
        role: input.role,
        tokenHash: tokenHash(rawToken),
        invitedByUserId: user.id,
        expiresAt,
      });
    } catch (error) {
      if (duplicateKey(error))
        throw new AppError(
          409,
          'INVITATION_ALREADY_PENDING',
          'A pending invitation already exists for this email.',
        );
      throw error;
    }
    const weddingName = await this.members.findWeddingName(actor.weddingId);
    if (!weddingName) {
      await this.members.revokeInvitation(actor.weddingId, created.id);
      throw new AppError(404, 'NOT_FOUND', 'Wedding not found.');
    }
    try {
      await this.emails.send({
        to: created.email,
        inviterName: user.name,
        weddingName,
        invitationUrl: `${config.APP_ORIGIN}/member-invitations/${rawToken}`,
        role: created.role,
      });
    } catch (error) {
      await this.members.revokeInvitation(actor.weddingId, created.id);
      throw error;
    }
    return created;
  }

  async listInvitations(userId: string) {
    const actor = await this.actor(userId, true);
    return this.members.listPendingInvitations(actor.weddingId, this.now());
  }

  async revokeInvitation(userId: string, invitationId: string) {
    const actor = await this.actor(userId, true);
    if (!(await this.members.revokeInvitation(actor.weddingId, invitationId)))
      throw new AppError(404, 'NOT_FOUND', 'Invitation not found.');
  }

  async getPublicInvitation(token: string) {
    const value = await this.members.findPublicInvitation(
      tokenHash(token),
      this.now(),
    );
    if (!value)
      throw new AppError(
        404,
        'INVALID_TOKEN',
        'This invitation is not valid or has expired.',
      );
    return value;
  }

  async acceptInvitation(user: { id: string; email: string }, token: string) {
    return this.members.acceptInvitation({
      tokenHash: tokenHash(token),
      userId: user.id,
      emailNormalized: normalizeEmail(user.email),
      now: this.now(),
    });
  }

  async changeRole(
    userId: string,
    membershipId: string,
    role: 'ADMIN' | 'MANAGER',
  ) {
    const actor = await this.actor(userId, true);
    const result = await this.members.changeRole({
      weddingId: actor.weddingId,
      membershipId,
      role,
    });
    if (result === 'LAST_ADMIN')
      throw new AppError(
        409,
        'LAST_ADMIN',
        'A wedding must always have at least one Admin.',
      );
    if (!result)
      throw new AppError(404, 'NOT_FOUND', 'Wedding member not found.');
    return result;
  }

  async removeMember(userId: string, membershipId: string) {
    const actor = await this.actor(userId, true);
    const result = await this.members.removeMember({
      weddingId: actor.weddingId,
      membershipId,
    });
    if (result === 'LAST_ADMIN')
      throw new AppError(
        409,
        'LAST_ADMIN',
        'The final Admin cannot be removed.',
      );
    if (!result)
      throw new AppError(404, 'NOT_FOUND', 'Wedding member not found.');
  }
}

export const memberService = new MemberService(
  new MongooseMemberRepository(),
  new ResendMemberInvitationEmailSender(),
);
