import { describe, expect, it } from 'vitest';
import { AppError } from '../src/shared/app-error.js';
import { WeddingService } from '../src/modules/wedding/wedding.service.js';
import type {
  CreateWeddingInput,
  WeddingMembershipRecord,
  WeddingRecord,
  WeddingRepository,
  UpdateWeddingInput,
} from '../src/modules/wedding/wedding.types.js';

const input: CreateWeddingInput = {
  brideName: 'Asha',
  groomName: 'Rohan',
  title: 'Asha & Rohan’s Wedding',
  weddingDate: '2027-02-18',
  timeZone: 'Asia/Kolkata',
  location: { formattedAddress: 'Jaipur, Rajasthan' },
};

class FakeWeddingRepository implements WeddingRepository {
  membership: WeddingMembershipRecord | null = null;
  wedding: WeddingRecord | null = null;
  failMembership = false;
  deletedWeddingId: string | null = null;
  updatedWeddingId: string | null = null;
  updateInput: UpdateWeddingInput | null = null;

  async findMembershipByUserId() {
    return this.membership;
  }

  async findWeddingById() {
    return this.wedding;
  }

  async createWedding(
    value: CreateWeddingInput & { createdByUserId: string; slug: string },
  ) {
    this.wedding = {
      id: 'wedding-1',
      ...input,
      website: { slug: value.slug, theme: 'classic', isPublished: false },
      gallery: { isEnabled: false, guestUploadsEnabled: false },
      livestream: { youtubeUrl: null, isEnabled: false },
    };
    return this.wedding;
  }

  async createMembership(value: {
    userId: string;
    weddingId: string;
    role: 'ADMIN' | 'MANAGER';
    joinedAt: Date;
  }) {
    if (this.failMembership) throw new Error('membership write failed');
    this.membership = { id: 'membership-1', ...value };
    return this.membership;
  }

  async updateWeddingById(weddingId: string, value: UpdateWeddingInput) {
    this.updatedWeddingId = weddingId;
    this.updateInput = value;
    if (!this.wedding) return null;
    this.wedding = {
      ...this.wedding,
      ...value,
      ...(value.title === null ? { title: undefined } : {}),
      ...(value.description === null ? { description: undefined } : {}),
      ...(value.location === null ? { location: undefined } : {}),
    };
    return this.wedding;
  }

  async deleteWeddingById(weddingId: string) {
    this.deletedWeddingId = weddingId;
    this.wedding = null;
  }
}

describe('WeddingService', () => {
  it('creates a wedding and first ADMIN membership for the current user', async () => {
    const repository = new FakeWeddingRepository();
    const result = await new WeddingService(repository).createWedding(
      'user-1',
      input,
    );

    expect(result.membership).toMatchObject({
      userId: 'user-1',
      weddingId: 'wedding-1',
      role: 'ADMIN',
    });
    expect(result.wedding.website.slug).toBe('asha-rohan-18022027');
  });

  it('rejects a user who already belongs to a wedding', async () => {
    const repository = new FakeWeddingRepository();
    repository.membership = {
      id: 'membership-1',
      userId: 'user-1',
      weddingId: 'wedding-1',
      role: 'ADMIN',
      joinedAt: new Date(),
    };

    await expect(
      new WeddingService(repository).createWedding('user-1', input),
    ).rejects.toMatchObject<Partial<AppError>>({
      status: 409,
      code: 'ALREADY_HAS_WEDDING',
    });
  });

  it('removes the wedding if the initial membership write fails', async () => {
    const repository = new FakeWeddingRepository();
    repository.failMembership = true;

    await expect(
      new WeddingService(repository).createWedding('user-1', input),
    ).rejects.toThrow('membership write failed');
    expect(repository.deletedWeddingId).toBe('wedding-1');
  });

  it.each(['ADMIN', 'MANAGER'] as const)(
    'allows a %s to update the wedding derived from membership',
    async (role) => {
      const repository = new FakeWeddingRepository();
      repository.membership = {
        id: 'membership-1',
        userId: 'user-1',
        weddingId: 'wedding-1',
        role,
        joinedAt: new Date(),
      };
      repository.wedding = {
        id: 'wedding-1',
        ...input,
        description: 'Original description',
        website: {
          slug: 'asha-rohan-18022027',
          theme: 'classic',
          isPublished: false,
        },
        gallery: { isEnabled: false, guestUploadsEnabled: false },
        livestream: { youtubeUrl: null, isEnabled: false },
      };

      const result = await new WeddingService(repository).updateWedding(
        'user-1',
        { title: 'Updated title', description: null },
      );

      expect(repository.updatedWeddingId).toBe('wedding-1');
      expect(repository.updateInput).toEqual({
        title: 'Updated title',
        description: null,
      });
      expect(result.title).toBe('Updated title');
      expect(result.description).toBeUndefined();
      expect(result.website.slug).toBe('asha-rohan-18022027');
    },
  );

  it('hides the wedding when the user has no membership', async () => {
    const repository = new FakeWeddingRepository();

    await expect(
      new WeddingService(repository).updateWedding('user-1', {
        title: 'Updated title',
      }),
    ).rejects.toMatchObject<Partial<AppError>>({
      status: 404,
      code: 'NOT_FOUND',
    });
    expect(repository.updatedWeddingId).toBeNull();
  });

  it('allows clearing the optional wedding title', async () => {
    const repository = new FakeWeddingRepository();
    repository.membership = {
      id: 'membership-1',
      userId: 'user-1',
      weddingId: 'wedding-1',
      role: 'ADMIN',
      joinedAt: new Date(),
    };
    repository.wedding = {
      id: 'wedding-1',
      ...input,
      website: {
        slug: 'asha-rohan-18022027',
        theme: 'classic',
        isPublished: false,
      },
      gallery: { isEnabled: false, guestUploadsEnabled: false },
      livestream: { youtubeUrl: null, isEnabled: false },
    };

    const result = await new WeddingService(repository).updateWedding(
      'user-1',
      { title: null },
    );

    expect(repository.updateInput).toEqual({ title: null });
    expect(result.title).toBeUndefined();
  });
});
