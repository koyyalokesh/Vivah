import type { WeddingRole } from '../wedding/wedding.types.js';

export type MemberRecord = {
  membershipId: string;
  user: { id: string; name: string; email: string };
  role: WeddingRole;
  joinedAt: Date;
};

export type InvitationRecord = {
  id: string;
  weddingId: string;
  email: string;
  emailNormalized: string;
  role: WeddingRole;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  expiresAt: Date;
};

export type PublicInvitation = Pick<InvitationRecord, 'email' | 'role'> & {
  wedding: { brideName: string; groomName: string; weddingDate: string };
  requiresLogin: true;
};

export interface MemberRepository {
  findActor(
    userId: string,
  ): Promise<{ weddingId: string; role: WeddingRole } | null>;
  listMembers(weddingId: string): Promise<MemberRecord[]>;
  findUserByEmail(emailNormalized: string): Promise<{ id: string } | null>;
  hasMembership(userId: string): Promise<boolean>;
  findWeddingName(weddingId: string): Promise<string | null>;
  revokeExpiredInvitation(
    weddingId: string,
    emailNormalized: string,
    now: Date,
  ): Promise<void>;
  createInvitation(input: {
    weddingId: string;
    email: string;
    emailNormalized: string;
    role: WeddingRole;
    tokenHash: string;
    invitedByUserId: string;
    expiresAt: Date;
  }): Promise<InvitationRecord>;
  revokeInvitation(weddingId: string, invitationId: string): Promise<boolean>;
  listPendingInvitations(
    weddingId: string,
    now: Date,
  ): Promise<InvitationRecord[]>;
  findPublicInvitation(
    tokenHash: string,
    now: Date,
  ): Promise<PublicInvitation | null>;
  acceptInvitation(input: {
    tokenHash: string;
    userId: string;
    emailNormalized: string;
    now: Date;
  }): Promise<{ weddingId: string; role: WeddingRole }>;
  changeRole(input: {
    weddingId: string;
    membershipId: string;
    role: WeddingRole;
  }): Promise<MemberRecord | 'LAST_ADMIN' | null>;
  removeMember(input: {
    weddingId: string;
    membershipId: string;
  }): Promise<'REMOVED' | 'LAST_ADMIN' | null>;
}

export interface MemberInvitationEmailSender {
  send(input: {
    to: string;
    inviterName: string;
    weddingName: string;
    invitationUrl: string;
    role: WeddingRole;
  }): Promise<void>;
}

export interface MemberServiceContract {
  listMembers(userId: string): Promise<MemberRecord[]>;
  invite(
    user: { id: string; name: string },
    input: { email: string; role: WeddingRole },
  ): Promise<InvitationRecord>;
  listInvitations(userId: string): Promise<InvitationRecord[]>;
  revokeInvitation(userId: string, invitationId: string): Promise<void>;
  getPublicInvitation(token: string): Promise<PublicInvitation>;
  acceptInvitation(
    user: { id: string; email: string },
    token: string,
  ): Promise<{ weddingId: string; role: WeddingRole }>;
  changeRole(
    userId: string,
    membershipId: string,
    role: WeddingRole,
  ): Promise<MemberRecord>;
  removeMember(userId: string, membershipId: string): Promise<void>;
}
