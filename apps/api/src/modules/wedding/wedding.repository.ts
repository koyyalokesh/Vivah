import { WeddingMembershipModel } from './wedding-membership.model.js';
import { WeddingModel } from './wedding.model.js';
import type {
  CreateWeddingInput,
  WeddingMembershipRecord,
  WeddingRecord,
  WeddingRepository,
  UpdateWeddingInput,
} from './wedding.types.js';

function toWeddingRecord(document: {
  _id: { toString(): string };
  brideName: string;
  groomName: string;
  title?: string;
  description?: string;
  weddingDate: string;
  timeZone: string;
  location?: WeddingRecord['location'];
  website: WeddingRecord['website'];
  gallery: WeddingRecord['gallery'];
  livestream: WeddingRecord['livestream'];
}): WeddingRecord {
  return {
    id: document._id.toString(),
    brideName: document.brideName,
    groomName: document.groomName,
    ...(document.title ? { title: document.title } : {}),
    ...(document.description ? { description: document.description } : {}),
    weddingDate: document.weddingDate,
    timeZone: document.timeZone,
    ...(document.location ? { location: document.location } : {}),
    website: document.website,
    gallery: document.gallery,
    livestream: document.livestream,
  };
}

function toMembershipRecord(document: {
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

export class MongooseWeddingRepository implements WeddingRepository {
  async findMembershipByUserId(userId: string) {
    const membership = await WeddingMembershipModel.findOne({ userId }).lean();
    return membership ? toMembershipRecord(membership) : null;
  }

  async findWeddingById(weddingId: string) {
    const wedding = await WeddingModel.findOne({
      _id: weddingId,
      deletedAt: { $exists: false },
    }).lean();
    return wedding ? toWeddingRecord(wedding) : null;
  }

  async createWedding(
    input: CreateWeddingInput & { createdByUserId: string; slug: string },
  ) {
    const wedding = await WeddingModel.create({
      brideName: input.brideName,
      groomName: input.groomName,
      title: input.title,
      description: input.description,
      weddingDate: input.weddingDate,
      timeZone: input.timeZone,
      location: input.location,
      createdByUserId: input.createdByUserId,
      website: {
        slug: input.slug,
        theme: 'classic',
        isPublished: false,
      },
      gallery: { isEnabled: false, guestUploadsEnabled: false },
      livestream: { youtubeUrl: null, isEnabled: false },
    });
    return toWeddingRecord(wedding);
  }

  async createMembership(input: {
    userId: string;
    weddingId: string;
    role: 'ADMIN' | 'MANAGER';
    joinedAt: Date;
  }) {
    const membership = await WeddingMembershipModel.create(input);
    return toMembershipRecord(membership);
  }

  async updateWeddingById(weddingId: string, input: UpdateWeddingInput) {
    const set: Record<string, unknown> = {};
    const unset: Record<string, 1> = {};

    for (const field of [
      'brideName',
      'groomName',
      'weddingDate',
      'timeZone',
    ] as const) {
      if (input[field] !== undefined) set[field] = input[field];
    }

    if (input.title === null) unset.title = 1;
    else if (input.title !== undefined) set.title = input.title;

    if (input.description === null) unset.description = 1;
    else if (input.description !== undefined)
      set.description = input.description;

    if (input.location === null) {
      unset.location = 1;
    } else if (input.location !== undefined) {
      for (const [field, value] of Object.entries(input.location)) {
        if (value !== undefined) set[`location.${field}`] = value;
      }
    }

    const update = {
      ...(Object.keys(set).length ? { $set: set } : {}),
      ...(Object.keys(unset).length ? { $unset: unset } : {}),
    };
    const wedding = await WeddingModel.findOneAndUpdate(
      { _id: weddingId, deletedAt: { $exists: false } },
      update,
      { returnDocument: 'after', runValidators: true },
    ).lean();
    return wedding ? toWeddingRecord(wedding) : null;
  }

  async deleteWeddingById(weddingId: string) {
    await WeddingModel.deleteOne({ _id: weddingId });
  }
}
