import mongoose from 'mongoose';

export type AuthRateLimit = {
  _id: string;
  totalHits: number;
  resetAt: Date;
};

const authRateLimitSchema = new mongoose.Schema<AuthRateLimit>(
  {
    _id: { type: String, required: true },
    totalHits: { type: Number, required: true, min: 0 },
    resetAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { versionKey: false },
);

export const AuthRateLimitModel =
  (mongoose.models.AuthRateLimit as
    mongoose.Model<AuthRateLimit> | undefined) ??
  mongoose.model<AuthRateLimit>(
    'AuthRateLimit',
    authRateLimitSchema,
    'auth_rate_limits',
  );
