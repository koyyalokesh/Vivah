import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { config } from '../config.js';
import { AppError } from '../shared/app-error.js';

let connectionPromise: Promise<typeof mongoose> | undefined;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!config.MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is required. Copy apps/api/.env.example to apps/api/.env and provide a development database URI.',
    );
  }

  connectionPromise ??= mongoose
    .connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .catch((error: unknown) => {
      connectionPromise = undefined;
      throw error;
    });

  return connectionPromise;
}

export async function disconnectDatabase() {
  connectionPromise = undefined;
  await mongoose.disconnect();
}

export const ensureDatabaseConnection: RequestHandler = (_req, _res, next) => {
  void connectDatabase()
    .then(() => next())
    .catch(() =>
      next(
        new AppError(
          503,
          'DATABASE_UNAVAILABLE',
          'The service is temporarily unavailable.',
        ),
      ),
    );
};
