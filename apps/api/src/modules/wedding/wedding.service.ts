import { AppError } from '../../shared/app-error.js';
import { MongooseWeddingRepository } from './wedding.repository.js';
import type {
  CreateWeddingInput,
  UpdateWeddingInput,
  WeddingRepository,
  WeddingServiceContract,
} from './wedding.types.js';

function isDuplicateKey(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

function slugPart(value: string) {
  return (
    value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'wedding'
  );
}

function compactWeddingDate(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}${month}${year}`;
}

export class WeddingService implements WeddingServiceContract {
  constructor(private readonly weddings: WeddingRepository) {}

  async getContextForUser(userId: string) {
    const membership = await this.weddings.findMembershipByUserId(userId);
    if (!membership) return null;

    const wedding = await this.weddings.findWeddingById(membership.weddingId);
    if (!wedding) {
      throw new AppError(404, 'NOT_FOUND', 'Wedding not found.');
    }
    return { membership, wedding };
  }

  async createWedding(userId: string, input: CreateWeddingInput) {
    if (await this.weddings.findMembershipByUserId(userId)) {
      throw new AppError(
        409,
        'ALREADY_HAS_WEDDING',
        'Your account already belongs to a wedding.',
      );
    }

    const baseSlug = `${slugPart(input.brideName)}-${slugPart(input.groomName)}-${compactWeddingDate(input.weddingDate)}`;
    let wedding;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        wedding = await this.weddings.createWedding({
          ...input,
          createdByUserId: userId,
          slug: attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`,
        });
        break;
      } catch (error) {
        if (!isDuplicateKey(error) || attempt === 5) throw error;
      }
    }

    if (!wedding) {
      throw new AppError(500, 'INTERNAL_ERROR', 'Unable to create wedding.');
    }

    try {
      const membership = await this.weddings.createMembership({
        userId,
        weddingId: wedding.id,
        role: 'ADMIN',
        joinedAt: new Date(),
      });
      return { wedding, membership };
    } catch (error) {
      await this.weddings.deleteWeddingById(wedding.id);
      if (isDuplicateKey(error)) {
        throw new AppError(
          409,
          'ALREADY_HAS_WEDDING',
          'Your account already belongs to a wedding.',
        );
      }
      throw error;
    }
  }

  async updateWedding(userId: string, input: UpdateWeddingInput) {
    const membership = await this.weddings.findMembershipByUserId(userId);
    if (!membership || !['ADMIN', 'MANAGER'].includes(membership.role)) {
      throw new AppError(404, 'NOT_FOUND', 'Wedding not found.');
    }

    const wedding = await this.weddings.updateWeddingById(
      membership.weddingId,
      input,
    );
    if (!wedding) {
      throw new AppError(404, 'NOT_FOUND', 'Wedding not found.');
    }
    return wedding;
  }
}

export const weddingService = new WeddingService(
  new MongooseWeddingRepository(),
);
