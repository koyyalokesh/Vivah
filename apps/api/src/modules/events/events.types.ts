import type { WeddingMembershipRecord } from '../wedding/wedding.types.js';

export type EventType =
  | 'ROKA'
  | 'ENGAGEMENT'
  | 'MEHENDI'
  | 'HALDI'
  | 'SANGEET'
  | 'COCKTAIL'
  | 'WEDDING'
  | 'RECEPTION'
  | 'CUSTOM';

export type EventRecord = {
  id: string;
  name: string;
  type?: EventType;
  startsAt: string;
  endsAt?: string;
  venueName?: string;
  address?: string;
  description?: string;
  dressCode?: string;
  archivedAt?: string;
  updatedAt: string;
};

export type EventInput = {
  name: string;
  type?: EventType | null;
  startsAt: string;
  endsAt?: string | null;
  venueName?: string | null;
  address?: string | null;
  description?: string | null;
  dressCode?: string | null;
};

export type EventListInput = {
  includeArchived?: boolean;
  from?: string;
  to?: string;
};

export type EventUpdateInput = Partial<EventInput> & {
  expectedUpdatedAt: string;
};

export interface EventRepository {
  findMembership(userId: string): Promise<WeddingMembershipRecord | null>;
  list(weddingId: string, input: EventListInput): Promise<EventRecord[]>;
  findById(weddingId: string, eventId: string): Promise<EventRecord | null>;
  create(weddingId: string, input: EventInput): Promise<EventRecord>;
  update(
    weddingId: string,
    eventId: string,
    expectedUpdatedAt: string,
    input: Partial<EventInput>,
  ): Promise<EventRecord | null>;
  archive(weddingId: string, eventId: string): Promise<boolean>;
}

export interface EventServiceContract {
  list(userId: string, input: EventListInput): Promise<EventRecord[]>;
  get(userId: string, eventId: string): Promise<EventRecord>;
  create(userId: string, input: EventInput): Promise<EventRecord>;
  update(
    userId: string,
    eventId: string,
    input: EventUpdateInput,
  ): Promise<EventRecord>;
  archive(userId: string, eventId: string): Promise<void>;
}
