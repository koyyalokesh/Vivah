import { describe, expect, it } from 'vitest';
import { EventService } from '../src/modules/events/events.service.js';
import type {
  EventInput,
  EventRecord,
  EventRepository,
} from '../src/modules/events/events.types.js';
import type { WeddingMembershipRecord } from '../src/modules/wedding/wedding.types.js';

const ceremony: EventRecord = {
  id: 'event-1',
  name: 'Mehendi',
  type: 'MEHENDI',
  startsAt: '2027-02-12T05:00:00.000Z',
  endsAt: '2027-02-12T09:00:00.000Z',
  venueName: 'Royal Garden',
  updatedAt: '2026-11-01T10:00:00.000Z',
};
class FakeEvents implements EventRepository {
  membership: WeddingMembershipRecord | null = {
    id: 'member-1',
    userId: 'user-1',
    weddingId: 'wedding-1',
    role: 'MANAGER',
    joinedAt: new Date(),
  };
  event: EventRecord | null = ceremony;
  requestedWeddingId = '';
  requestedVersion = '';
  failUpdate = false;
  async findMembership() {
    return this.membership;
  }
  async list(weddingId: string) {
    this.requestedWeddingId = weddingId;
    return this.event ? [this.event] : [];
  }
  async findById(weddingId: string) {
    this.requestedWeddingId = weddingId;
    return this.event;
  }
  async create(weddingId: string, input: EventInput) {
    this.requestedWeddingId = weddingId;
    return {
      ...ceremony,
      ...input,
      type: input.type ?? undefined,
      endsAt: input.endsAt ?? undefined,
      updatedAt: ceremony.updatedAt,
    };
  }
  async update(
    weddingId: string,
    _eventId: string,
    version: string,
    input: Partial<EventInput>,
  ) {
    this.requestedWeddingId = weddingId;
    this.requestedVersion = version;
    if (this.failUpdate || !this.event) return null;
    return {
      ...this.event,
      ...input,
      type: input.type ?? this.event.type,
      endsAt:
        input.endsAt === null ? undefined : (input.endsAt ?? this.event.endsAt),
      updatedAt: '2026-11-01T11:00:00.000Z',
    };
  }
  async archive(weddingId: string) {
    this.requestedWeddingId = weddingId;
    if (!this.event || this.event.archivedAt) return false;
    this.event = { ...this.event, archivedAt: new Date().toISOString() };
    return true;
  }
}

describe('EventService', () => {
  it('derives wedding scope from membership for listing and creation', async () => {
    const repository = new FakeEvents();
    const service = new EventService(repository);
    await service.list('user-1', {});
    expect(repository.requestedWeddingId).toBe('wedding-1');
    await service.create('user-1', {
      name: 'Haldi',
      startsAt: '2027-02-13T05:00:00.000Z',
    });
    expect(repository.requestedWeddingId).toBe('wedding-1');
  });
  it('returns not found without a wedding membership', async () => {
    const repository = new FakeEvents();
    repository.membership = null;
    await expect(
      new EventService(repository).get('user-1', 'event-1'),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });
  it('rejects an end before the existing start after merging an update', async () => {
    const repository = new FakeEvents();
    await expect(
      new EventService(repository).update('user-1', 'event-1', {
        endsAt: '2027-02-12T04:00:00.000Z',
        expectedUpdatedAt: ceremony.updatedAt,
      }),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });
  it('keeps archived events read-only', async () => {
    const repository = new FakeEvents();
    repository.event = { ...ceremony, archivedAt: '2026-11-01T12:00:00.000Z' };
    await expect(
      new EventService(repository).update('user-1', 'event-1', {
        name: 'Changed',
        expectedUpdatedAt: ceremony.updatedAt,
      }),
    ).rejects.toMatchObject({ status: 409, code: 'EVENT_ARCHIVED' });
  });
  it('archives only within the membership wedding', async () => {
    const repository = new FakeEvents();
    await new EventService(repository).archive('user-1', 'event-1');
    expect(repository.requestedWeddingId).toBe('wedding-1');
    expect(repository.event?.archivedAt).toBeTruthy();
  });
  it('compares merged timestamps by instant across different offsets', async () => {
    const repository = new FakeEvents();
    await expect(
      new EventService(repository).update('user-1', 'event-1', {
        endsAt: '2027-02-12T10:00:00+05:30',
        expectedUpdatedAt: ceremony.updatedAt,
      }),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });
  it('passes the client version to the repository for concurrency checks', async () => {
    const repository = new FakeEvents();
    const expectedUpdatedAt = '2026-10-31T09:00:00.000Z';
    await new EventService(repository).update('user-1', 'event-1', {
      name: 'Updated',
      expectedUpdatedAt,
    });
    expect(repository.requestedVersion).toBe(expectedUpdatedAt);
  });
  it('accepts a valid range expressed with different offsets', async () => {
    const repository = new FakeEvents();
    const updated = await new EventService(repository).update(
      'user-1',
      'event-1',
      {
        startsAt: '2027-02-12T10:00:00+05:30',
        endsAt: '2027-02-12T05:00:00Z',
        expectedUpdatedAt: ceremony.updatedAt,
      },
    );
    expect(updated.endsAt).toBe('2027-02-12T05:00:00Z');
  });
  it('reports concurrent update conflicts', async () => {
    const repository = new FakeEvents();
    repository.failUpdate = true;
    await expect(
      new EventService(repository).update('user-1', 'event-1', {
        name: 'Updated',
        expectedUpdatedAt: ceremony.updatedAt,
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' });
  });
});
