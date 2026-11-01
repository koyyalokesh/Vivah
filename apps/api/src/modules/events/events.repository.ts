import mongoose from 'mongoose';
import { WeddingMembershipModel } from '../wedding/wedding-membership.model.js';
import type { WeddingMembershipRecord } from '../wedding/wedding.types.js';
import { EventModel } from './event.model.js';
import type {
  EventInput,
  EventListInput,
  EventRecord,
  EventRepository,
  EventType,
} from './events.types.js';

function toMembership(document: {
  _id: { toString(): string };
  userId: { toString(): string };
  weddingId: { toString(): string };
  role: 'ADMIN' | 'MANAGER';
  joinedAt: Date;
}): WeddingMembershipRecord {
  return {
    id: document._id.toString(),
    userId: document.userId.toString(),
    weddingId: document.weddingId.toString(),
    role: document.role,
    joinedAt: document.joinedAt,
  };
}

function toRecord(document: {
  _id: { toString(): string };
  name: string;
  type?: EventType;
  startsAt: Date;
  endsAt?: Date;
  venueName?: string;
  address?: string;
  description?: string;
  dressCode?: string;
  archivedAt?: Date;
  updatedAt: Date;
}): EventRecord {
  return {
    id: document._id.toString(),
    name: document.name,
    ...(document.type ? { type: document.type } : {}),
    startsAt: document.startsAt.toISOString(),
    ...(document.endsAt ? { endsAt: document.endsAt.toISOString() } : {}),
    ...(document.venueName ? { venueName: document.venueName } : {}),
    ...(document.address ? { address: document.address } : {}),
    ...(document.description ? { description: document.description } : {}),
    ...(document.dressCode ? { dressCode: document.dressCode } : {}),
    ...(document.archivedAt
      ? { archivedAt: document.archivedAt.toISOString() }
      : {}),
    updatedAt: document.updatedAt.toISOString(),
  };
}

function updateOperators(input: Partial<EventInput>) {
  const set: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};
  for (const [field, value] of Object.entries(input)) {
    if (value === null || value === '') unset[field] = 1;
    else if (value !== undefined) set[field] = value;
  }
  return {
    ...(Object.keys(set).length ? { $set: set } : {}),
    ...(Object.keys(unset).length ? { $unset: unset } : {}),
  };
}

export class MongooseEventRepository implements EventRepository {
  async findMembership(userId: string) {
    const result = await WeddingMembershipModel.findOne({ userId }).lean();
    return result ? toMembership(result) : null;
  }

  async list(weddingId: string, input: EventListInput) {
    const startsAt: Record<string, Date> = {};
    if (input.from) startsAt.$gte = new Date(input.from);
    if (input.to) startsAt.$lte = new Date(input.to);
    const filter = {
      weddingId,
      ...(input.includeArchived ? {} : { archivedAt: { $exists: false } }),
      ...(Object.keys(startsAt).length ? { startsAt } : {}),
    };
    const results = await EventModel.find(filter)
      .sort({ startsAt: 1, _id: 1 })
      .lean();
    return results.map(toRecord);
  }

  async findById(weddingId: string, eventId: string) {
    if (!mongoose.isValidObjectId(eventId)) return null;
    const result = await EventModel.findOne({ _id: eventId, weddingId }).lean();
    return result ? toRecord(result) : null;
  }

  async create(weddingId: string, input: EventInput) {
    const result = await EventModel.create({ weddingId, ...input });
    return toRecord(result);
  }

  async update(
    weddingId: string,
    eventId: string,
    expectedUpdatedAt: string,
    input: Partial<EventInput>,
  ) {
    if (!mongoose.isValidObjectId(eventId)) return null;
    const result = await EventModel.findOneAndUpdate(
      {
        _id: eventId,
        weddingId,
        archivedAt: { $exists: false },
        updatedAt: new Date(expectedUpdatedAt),
      },
      updateOperators(input),
      { returnDocument: 'after', runValidators: true },
    ).lean();
    return result ? toRecord(result) : null;
  }

  async archive(weddingId: string, eventId: string) {
    if (!mongoose.isValidObjectId(eventId)) return false;
    const result = await EventModel.updateOne(
      { _id: eventId, weddingId, archivedAt: { $exists: false } },
      { $set: { archivedAt: new Date() } },
    );
    return result.modifiedCount === 1;
  }
}
