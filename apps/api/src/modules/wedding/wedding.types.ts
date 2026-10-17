export type WeddingRole = 'ADMIN' | 'MANAGER';

export type WeddingLocation = {
  formattedAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
};

export type WeddingRecord = {
  id: string;
  brideName: string;
  groomName: string;
  title?: string;
  description?: string;
  weddingDate: string;
  timeZone: string;
  location?: WeddingLocation;
  website: {
    slug: string;
    theme: string;
    isPublished: boolean;
  };
  gallery: {
    isEnabled: boolean;
    guestUploadsEnabled: boolean;
  };
  livestream: {
    youtubeUrl: string | null;
    isEnabled: boolean;
  };
};

export type WeddingMembershipRecord = {
  id: string;
  userId: string;
  weddingId: string;
  role: WeddingRole;
  joinedAt: Date;
};

export type WeddingContext = {
  membership: WeddingMembershipRecord;
  wedding: WeddingRecord;
};

export type CreateWeddingInput = {
  brideName: string;
  groomName: string;
  title?: string;
  description?: string;
  weddingDate: string;
  timeZone: string;
  location?: WeddingLocation;
};

export type UpdateWeddingInput = Partial<
  Pick<
    CreateWeddingInput,
    'brideName' | 'groomName' | 'weddingDate' | 'timeZone'
  >
> & {
  title?: string | null;
  description?: string | null;
  location?: WeddingLocation | null;
};

export interface WeddingRepository {
  findMembershipByUserId(
    userId: string,
  ): Promise<WeddingMembershipRecord | null>;
  findWeddingById(weddingId: string): Promise<WeddingRecord | null>;
  createWedding(
    input: CreateWeddingInput & {
      createdByUserId: string;
      slug: string;
    },
  ): Promise<WeddingRecord>;
  updateWeddingById(
    weddingId: string,
    input: UpdateWeddingInput,
  ): Promise<WeddingRecord | null>;
  createMembership(input: {
    userId: string;
    weddingId: string;
    role: WeddingRole;
    joinedAt: Date;
  }): Promise<WeddingMembershipRecord>;
  deleteWeddingById(weddingId: string): Promise<void>;
}

export interface WeddingServiceContract {
  getContextForUser(userId: string): Promise<WeddingContext | null>;
  createWedding(
    userId: string,
    input: CreateWeddingInput,
  ): Promise<WeddingContext>;
  updateWedding(
    userId: string,
    input: UpdateWeddingInput,
  ): Promise<WeddingRecord>;
}
