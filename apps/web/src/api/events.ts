import { apiRequest } from './auth';

export const eventTypeLabels = {
  ROKA: 'Roka',
  ENGAGEMENT: 'Engagement',
  MEHENDI: 'Mehendi',
  HALDI: 'Haldi',
  SANGEET: 'Sangeet',
  COCKTAIL: 'Cocktail',
  WEDDING: 'Wedding',
  RECEPTION: 'Reception',
  CUSTOM: 'Custom event',
} as const;
export type EventType = keyof typeof eventTypeLabels;
export type WeddingEvent = {
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
export type EventUpdateInput = Partial<EventInput> & {
  expectedUpdatedAt: string;
};

export async function getEvents(includeArchived = false) {
  const response = await apiRequest<{ data: WeddingEvent[] }>(
    `/api/events${includeArchived ? '?includeArchived=true' : ''}`,
  );
  return response.data;
}
export async function getEvent(id: string) {
  const response = await apiRequest<{ data: WeddingEvent }>(
    `/api/events/${id}`,
  );
  return response.data;
}
export async function createEvent(input: EventInput) {
  const response = await apiRequest<{ data: WeddingEvent }>('/api/events', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data;
}
export async function updateEvent(id: string, input: EventUpdateInput) {
  const response = await apiRequest<{ data: WeddingEvent }>(
    `/api/events/${id}`,
    { method: 'PATCH', body: JSON.stringify(input) },
  );
  return response.data;
}
export async function archiveEvent(id: string) {
  await apiRequest(`/api/events/${id}`, { method: 'DELETE' });
}
