import mongoose from 'mongoose';
import { AppError } from '../../shared/app-error.js';
import { UserModel } from '../auth/user.model.js';
import { WeddingMembershipModel } from '../wedding/wedding-membership.model.js';
import { WeddingModel } from '../wedding/wedding.model.js';
import { MemberInvitationModel } from './member-invitation.model.js';
import type {
  InvitationRecord,
  MemberRecord,
  MemberRepository,
  PublicInvitation,
} from './members.types.js';

function invitation(value: unknown): InvitationRecord {
  const document = value as {
    _id: { toString(): string };
    weddingId: { toString(): string };
    email: string;
    emailNormalized: string;
    role: 'ADMIN' | 'MANAGER';
    status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
    expiresAt: Date;
  };
  return {
    id: document._id.toString(),
    weddingId: document.weddingId.toString(),
    email: document.email,
    emailNormalized: document.emailNormalized,
    role: document.role,
    status: document.status,
    expiresAt: document.expiresAt,
  };
}

function member(value: unknown): MemberRecord {
  const document = value as {
    _id: { toString(): string };
    userId: {
      _id: { toString(): string };
      name: string;
      email: string;
    };
    role: 'ADMIN' | 'MANAGER';
    joinedAt: Date;
  };
  return {
    membershipId: document._id.toString(),
    user: {
      id: document.userId._id.toString(),
      name: document.userId.name,
      email: document.userId.email,
    },
    role: document.role,
    joinedAt: document.joinedAt,
  };
}

class AbortMembershipMutation extends Error {
  constructor(readonly result: 'LAST_ADMIN' | null) {
    super('Membership mutation was rejected.');
  }
}

export class MongooseMemberRepository implements MemberRepository {
  async findActor(userId: string) {
    const value = await WeddingMembershipModel.findOne({ userId }).lean();
    return value
      ? { weddingId: value.weddingId.toString(), role: value.role }
      : null;
  }

  async listMembers(weddingId: string) {
    const values = await WeddingMembershipModel.find({ weddingId })
      .populate('userId', 'name email')
      .sort({ joinedAt: 1 })
      .lean();
    return values.map(member);
  }

  async findUserByEmail(emailNormalized: string) {
    const user = await UserModel.findOne({ emailNormalized })
      .select('_id')
      .lean();
    return user ? { id: user._id.toString() } : null;
  }

  async hasMembership(userId: string) {
    return Boolean(await WeddingMembershipModel.exists({ userId }));
  }

  async findWeddingName(weddingId: string) {
    const wedding = await WeddingModel.findOne({
      _id: weddingId,
      deletedAt: { $exists: false },
    })
      .select('title brideName groomName')
      .lean();
    return wedding
      ? wedding.title || `${wedding.brideName} & ${wedding.groomName}`
      : null;
  }

  async revokeExpiredInvitation(
    weddingId: string,
    emailNormalized: string,
    now: Date,
  ) {
    await MemberInvitationModel.updateMany(
      {
        weddingId,
        emailNormalized,
        status: 'PENDING',
        expiresAt: { $lte: now },
      },
      { $set: { status: 'REVOKED' } },
    );
  }

  async createInvitation(
    input: Parameters<MemberRepository['createInvitation']>[0],
  ) {
    const value = await MemberInvitationModel.create(input);
    return invitation(value);
  }

  async revokeInvitation(weddingId: string, invitationId: string) {
    const result = await MemberInvitationModel.updateOne(
      { _id: invitationId, weddingId, status: 'PENDING' },
      { $set: { status: 'REVOKED' } },
    );
    return result.modifiedCount === 1;
  }

  async listPendingInvitations(weddingId: string, now: Date) {
    const values = await MemberInvitationModel.find({
      weddingId,
      status: 'PENDING',
      expiresAt: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .lean();
    return values.map(invitation);
  }

  async findPublicInvitation(
    tokenHash: string,
    now: Date,
  ): Promise<PublicInvitation | null> {
    const value = await MemberInvitationModel.findOne({
      tokenHash,
      status: 'PENDING',
      expiresAt: { $gt: now },
    })
      .select('+tokenHash')
      .lean();
    if (!value) return null;
    const wedding = await WeddingModel.findOne({
      _id: value.weddingId,
      deletedAt: { $exists: false },
    })
      .select('brideName groomName weddingDate')
      .lean();
    return wedding
      ? {
          email: value.email,
          role: value.role,
          requiresLogin: true as const,
          wedding: {
            brideName: wedding.brideName,
            groomName: wedding.groomName,
            weddingDate: wedding.weddingDate,
          },
        }
      : null;
  }

  async acceptInvitation(
    input: Parameters<MemberRepository['acceptInvitation']>[0],
  ) {
    const session = await mongoose.startSession();
    let accepted: { weddingId: string; role: 'ADMIN' | 'MANAGER' } | undefined;
    try {
      await session.withTransaction(async () => {
        accepted = undefined;
        const invite = await MemberInvitationModel.findOne({
          tokenHash: input.tokenHash,
        })
          .select('+tokenHash')
          .session(session);
        if (!invite)
          throw new AppError(
            404,
            'INVALID_TOKEN',
            'This invitation is not valid.',
          );
        if (invite.status !== 'PENDING')
          throw new AppError(
            409,
            'INVITATION_ALREADY_ACCEPTED',
            'This invitation is no longer available.',
          );
        if (invite.expiresAt <= input.now)
          throw new AppError(
            410,
            'TOKEN_EXPIRED',
            'This invitation has expired.',
          );
        if (invite.emailNormalized !== input.emailNormalized)
          throw new AppError(
            403,
            'INVITATION_EMAIL_MISMATCH',
            'Sign in with the email address that received this invitation.',
          );
        const weddingExists = await WeddingModel.exists({
          _id: invite.weddingId,
          deletedAt: { $exists: false },
        }).session(session);
        if (!weddingExists)
          throw new AppError(
            404,
            'INVALID_TOKEN',
            'This invitation is not valid.',
          );
        if (
          await WeddingMembershipModel.exists({ userId: input.userId }).session(
            session,
          )
        )
          throw new AppError(
            409,
            'ALREADY_HAS_WEDDING',
            'Your account already belongs to a wedding.',
          );
        await WeddingMembershipModel.create(
          [
            {
              userId: input.userId,
              weddingId: invite.weddingId,
              role: invite.role,
              joinedAt: input.now,
            },
          ],
          { session },
        );
        invite.status = 'ACCEPTED';
        invite.acceptedByUserId = new mongoose.Types.ObjectId(input.userId);
        invite.acceptedAt = input.now;
        await invite.save({ session });
        accepted = {
          weddingId: invite.weddingId.toString(),
          role: invite.role,
        };
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new AppError(
          409,
          'ALREADY_HAS_WEDDING',
          'Your account already belongs to a wedding.',
        );
      }
      throw error;
    } finally {
      await session.endSession();
    }
    if (!accepted)
      throw new AppError(
        409,
        'INVITATION_ALREADY_ACCEPTED',
        'This invitation is no longer available.',
      );
    return accepted;
  }

  async changeRole(input: Parameters<MemberRepository['changeRole']>[0]) {
    const session = await mongoose.startSession();
    let result: MemberRecord | null = null;
    try {
      await session.withTransaction(async () => {
        result = null;
        await WeddingModel.updateOne(
          { _id: input.weddingId },
          { $set: { updatedAt: new Date() } },
          { session },
        );
        const target = await WeddingMembershipModel.findOne({
          _id: input.membershipId,
          weddingId: input.weddingId,
        }).session(session);
        if (!target) throw new AbortMembershipMutation(null);
        if (target.role === 'ADMIN' && input.role === 'MANAGER') {
          const admins = await WeddingMembershipModel.countDocuments({
            weddingId: input.weddingId,
            role: 'ADMIN',
          }).session(session);
          if (admins <= 1) throw new AbortMembershipMutation('LAST_ADMIN');
        }
        target.role = input.role;
        await target.save({ session });
        const populated = await WeddingMembershipModel.findById(target._id)
          .populate('userId', 'name email')
          .session(session)
          .lean();
        result = populated ? member(populated) : null;
      });
    } catch (error) {
      if (error instanceof AbortMembershipMutation) return error.result;
      throw error;
    } finally {
      await session.endSession();
    }
    return result;
  }

  async removeMember(input: Parameters<MemberRepository['removeMember']>[0]) {
    const session = await mongoose.startSession();
    let result: 'REMOVED' | 'LAST_ADMIN' | null = null;
    try {
      await session.withTransaction(async () => {
        result = null;
        await WeddingModel.updateOne(
          { _id: input.weddingId },
          { $set: { updatedAt: new Date() } },
          { session },
        );
        const target = await WeddingMembershipModel.findOne({
          _id: input.membershipId,
          weddingId: input.weddingId,
        }).session(session);
        if (!target) throw new AbortMembershipMutation(null);
        if (target.role === 'ADMIN') {
          const admins = await WeddingMembershipModel.countDocuments({
            weddingId: input.weddingId,
            role: 'ADMIN',
          }).session(session);
          if (admins <= 1) throw new AbortMembershipMutation('LAST_ADMIN');
        }
        await target.deleteOne({ session });
        result = 'REMOVED';
      });
    } catch (error) {
      if (error instanceof AbortMembershipMutation) return error.result;
      throw error;
    } finally {
      await session.endSession();
    }
    return result;
  }
}
