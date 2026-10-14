import { WeddingMembershipModel } from './wedding-membership.model.js';
import { WeddingModel } from './wedding.model.js';
import type {
  CreateWeddingInput,
  WeddingMembershipRecord,
  WeddingRecord,
  WeddingRepository,
} from './wedding.types.js';

function toWeddingRecord(document: {
  _id: { toString(): string };
  brideName: string;
  groomName: string;
  title: string;
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
    title: document.title,
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

  async deleteWeddingById(weddingId: string) {
    await WeddingModel.deleteOne({ _id: weddingId });
  }
}
