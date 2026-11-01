import { AppError } from '../../shared/app-error.js';
import { MongooseEventRepository } from './events.repository.js';
import type {
  EventInput,
  EventListInput,
  EventRepository,
  EventServiceContract,
  EventUpdateInput,
} from './events.types.js';

export class EventService implements EventServiceContract {
  constructor(private readonly events: EventRepository) {}

  private async membership(userId: string) {
    const membership = await this.events.findMembership(userId);
    if (!membership || !['ADMIN', 'MANAGER'].includes(membership.role)) {
      throw new AppError(404, 'NOT_FOUND', 'Wedding not found.');
    }
    return membership;
  }

  async list(userId: string, input: EventListInput) {
    const membership = await this.membership(userId);
    return this.events.list(membership.weddingId, input);
  }

  async get(userId: string, eventId: string) {
    const membership = await this.membership(userId);
    const event = await this.events.findById(membership.weddingId, eventId);
    if (!event) throw new AppError(404, 'NOT_FOUND', 'Event not found.');
    return event;
  }

  async create(userId: string, input: EventInput) {
    const membership = await this.membership(userId);
    return this.events.create(membership.weddingId, input);
  }

  async update(userId: string, eventId: string, input: EventUpdateInput) {
    const membership = await this.membership(userId);
    const existing = await this.events.findById(membership.weddingId, eventId);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Event not found.');
    if (existing.archivedAt) {
      throw new AppError(
        409,
        'EVENT_ARCHIVED',
        'Archived events cannot be edited.',
      );
    }
    const { expectedUpdatedAt, ...changes } = input;
    const startsAt = changes.startsAt ?? existing.startsAt;
    const endsAt =
      changes.endsAt === null ? undefined : (changes.endsAt ?? existing.endsAt);
    if (endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'End time must be after the start time.',
        {
          endsAt: ['End time must be after the start time.'],
        },
      );
    }
    const updated = await this.events.update(
      membership.weddingId,
      eventId,
      expectedUpdatedAt,
      changes,
    );
    if (!updated) {
      throw new AppError(
        409,
        'CONFLICT',
        'This event changed. Reload it before trying again.',
      );
    }
    return updated;
  }

  async archive(userId: string, eventId: string) {
    const membership = await this.membership(userId);
    if (!(await this.events.archive(membership.weddingId, eventId))) {
      throw new AppError(404, 'NOT_FOUND', 'Event not found.');
    }
  }
}

export const eventService = new EventService(new MongooseEventRepository());
