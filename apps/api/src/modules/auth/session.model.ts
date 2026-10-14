import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: 'User',
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false,
    },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    lastUsedAt: { type: Date },
  },
  { timestamps: true },
);

export const SessionModel =
  mongoose.models.Session ??
  mongoose.model('Session', sessionSchema, 'sessions');
