import { SessionModel } from './session.model.js';
import type {
  PublicUser,
  SessionRecord,
  SessionRepository,
  UserRecord,
  UserRepository,
} from './auth.types.js';
import { UserModel } from './user.model.js';

function toPublicUser(document: {
  _id: { toString(): string };
  name: string;
  email: string;
}): PublicUser {
  return {
    id: document._id.toString(),
    name: document.name,
    email: document.email,
  };
}

export class MongooseUserRepository implements UserRepository {
  async findByEmail(emailNormalized: string): Promise<UserRecord | null> {
    const user = await UserModel.findOne({ emailNormalized })
      .select('+emailNormalized +passwordHash')
      .lean();

    if (!user) return null;

    return {
      ...toPublicUser(user),
      emailNormalized: user.emailNormalized,
      passwordHash: user.passwordHash,
    };
  }

  async findById(id: string): Promise<PublicUser | null> {
    const user = await UserModel.findById(id).lean();
    return user ? toPublicUser(user) : null;
  }

  async create(input: {
    name: string;
    email: string;
    emailNormalized: string;
    passwordHash: string;
  }): Promise<PublicUser> {
    const user = await UserModel.create(input);
    return toPublicUser(user);
  }

  async deleteById(id: string) {
    await UserModel.deleteOne({ _id: id });
  }
}

export class MongooseSessionRepository implements SessionRepository {
  async create(input: { userId: string; tokenHash: string; expiresAt: Date }) {
    await SessionModel.create(input);
  }

  async findActiveByTokenHash(
    tokenHash: string,
    now: Date,
  ): Promise<SessionRecord | null> {
    const session = await SessionModel.findOne({
      tokenHash,
      expiresAt: { $gt: now },
    })
      .select('+tokenHash')
      .lean();

    if (!session) return null;

    return {
      id: session._id.toString(),
      userId: session.userId.toString(),
      tokenHash: session.tokenHash,
      expiresAt: session.expiresAt,
    };
  }

  async deleteByTokenHash(tokenHash: string) {
    await SessionModel.deleteOne({ tokenHash });
  }
}
