import type { ClientRateLimitInfo } from 'express-rate-limit';
import { describe, expect, it } from 'vitest';
import {
  MongoRateLimitStore,
  type RateLimitCounterRepository,
} from '../src/modules/auth/rate-limit.store.js';

class MemoryRateLimitCounters implements RateLimitCounterRepository {
  records = new Map<string, ClientRateLimitInfo>();

  async increment(key: string, now: Date, newResetTime: Date) {
    const current = this.records.get(key);
    const next =
      current?.resetTime && current.resetTime > now
        ? { totalHits: current.totalHits + 1, resetTime: current.resetTime }
        : { totalHits: 1, resetTime: newResetTime };
    this.records.set(key, next);
    return next;
  }

  async decrement(key: string) {
    const current = this.records.get(key);
    if (current) {
      this.records.set(key, {
        ...current,
        totalHits: Math.max(0, current.totalHits - 1),
      });
    }
  }

  async reset(key: string) {
    this.records.delete(key);
  }
}

describe('MongoRateLimitStore', () => {
  it('shares counters between store instances and never persists the raw client key', async () => {
    const repository = new MemoryRateLimitCounters();
    const firstInstance = new MongoRateLimitStore(
      repository,
      'test-secret-that-is-at-least-32-characters',
      60_000,
    );
    const secondInstance = new MongoRateLimitStore(
      repository,
      'test-secret-that-is-at-least-32-characters',
      60_000,
    );

    expect((await firstInstance.increment('192.0.2.1')).totalHits).toBe(1);
    expect((await secondInstance.increment('192.0.2.1')).totalHits).toBe(2);

    const [storedKey] = repository.records.keys();
    expect(storedKey).toMatch(/^[a-f0-9]{64}$/);
    expect(storedKey).not.toContain('192.0.2.1');
  });

  it('uses different counters when the HMAC secret changes', async () => {
    const repository = new MemoryRateLimitCounters();
    const first = new MongoRateLimitStore(
      repository,
      'first-secret-that-is-at-least-32-characters',
      60_000,
    );
    const second = new MongoRateLimitStore(
      repository,
      'second-secret-that-is-at-least-32-characters',
      60_000,
    );

    expect((await first.increment('192.0.2.1')).totalHits).toBe(1);
    expect((await second.increment('192.0.2.1')).totalHits).toBe(1);
    expect(repository.records.size).toBe(2);
  });
});
