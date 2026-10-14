import { createHmac } from 'node:crypto';
import type { ClientRateLimitInfo, Store } from 'express-rate-limit';
import { config } from '../../config.js';
import { AuthRateLimitModel } from './rate-limit.model.js';

export interface RateLimitCounterRepository {
  increment(
    keyHash: string,
    now: Date,
    newResetTime: Date,
  ): Promise<ClientRateLimitInfo>;
  decrement(keyHash: string): Promise<void>;
  reset(keyHash: string): Promise<void>;
}

export class MongoRateLimitCounterRepository implements RateLimitCounterRepository {
  async increment(keyHash: string, now: Date, newResetTime: Date) {
    const activeWindow = {
      $gt: [{ $ifNull: ['$resetAt', new Date(0)] }, now],
    };
    const counter = await AuthRateLimitModel.findOneAndUpdate(
      { _id: keyHash },
      [
        {
          $set: {
            totalHits: {
              $cond: [
                activeWindow,
                { $add: [{ $ifNull: ['$totalHits', 0] }, 1] },
                1,
              ],
            },
            resetAt: {
              $cond: [activeWindow, '$resetAt', newResetTime],
            },
          },
        },
      ],
      { upsert: true, returnDocument: 'after', updatePipeline: true },
    ).lean();

    if (!counter) {
      throw new Error('Unable to update the authentication rate limit.');
    }

    return {
      totalHits: Number(counter.totalHits),
      resetTime: new Date(counter.resetAt),
    };
  }

  async decrement(keyHash: string) {
    await AuthRateLimitModel.updateOne(
      { _id: keyHash, totalHits: { $gt: 0 } },
      { $inc: { totalHits: -1 } },
    );
  }

  async reset(keyHash: string) {
    await AuthRateLimitModel.deleteOne({ _id: keyHash });
  }
}

export class MongoRateLimitStore implements Store {
  readonly localKeys = false;
  readonly prefix = 'auth:';

  constructor(
    private readonly repository: RateLimitCounterRepository = new MongoRateLimitCounterRepository(),
    private readonly secret = config.RATE_LIMIT_HMAC_SECRET,
    private readonly windowMs = 15 * 60 * 1000,
  ) {}

  increment(key: string) {
    const now = new Date();
    return this.repository.increment(
      this.hashKey(key),
      now,
      new Date(now.getTime() + this.windowMs),
    );
  }

  decrement(key: string) {
    return this.repository.decrement(this.hashKey(key));
  }

  resetKey(key: string) {
    return this.repository.reset(this.hashKey(key));
  }

  private hashKey(key: string) {
    return createHmac('sha256', this.secret)
      .update(`${this.prefix}${key}`)
      .digest('hex');
  }
}
