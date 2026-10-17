import mongoose from 'mongoose';

const memberInvitationSchema = new mongoose.Schema(
  {
    weddingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Wedding',
    },
    email: { type: String, required: true, trim: true },
    emailNormalized: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ['ADMIN', 'MANAGER'] },
    tokenHash: { type: String, required: true, select: false },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'ACCEPTED', 'REVOKED'],
      default: 'PENDING',
    },
    invitedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    acceptedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date, required: true },
    acceptedAt: Date,
  },
  { timestamps: true },
);

memberInvitationSchema.index({ tokenHash: 1 }, { unique: true });
memberInvitationSchema.index({ weddingId: 1, status: 1 });
memberInvitationSchema.index({ emailNormalized: 1 });
memberInvitationSchema.index({ expiresAt: 1 });
memberInvitationSchema.index(
  { weddingId: 1, emailNormalized: 1 },
  { unique: true, partialFilterExpression: { status: 'PENDING' } },
);

export const MemberInvitationModel =
  mongoose.models.WeddingMemberInvitation ??
  mongoose.model(
    'WeddingMemberInvitation',
    memberInvitationSchema,
    'wedding_member_invitations',
  );
