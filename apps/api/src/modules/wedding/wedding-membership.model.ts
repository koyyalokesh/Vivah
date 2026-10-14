import mongoose from 'mongoose';

const weddingMembershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    weddingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Wedding',
    },
    role: {
      type: String,
      required: true,
      enum: ['ADMIN', 'MANAGER'],
    },
    joinedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

weddingMembershipSchema.index({ userId: 1 }, { unique: true });
weddingMembershipSchema.index({ weddingId: 1, userId: 1 }, { unique: true });
weddingMembershipSchema.index({ weddingId: 1, role: 1 });

export const WeddingMembershipModel =
  mongoose.models.WeddingMembership ??
  mongoose.model(
    'WeddingMembership',
    weddingMembershipSchema,
    'wedding_memberships',
  );
