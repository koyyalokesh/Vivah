import { apiRequest, type Wedding, type WeddingMembership } from './auth';

export type CreateWeddingInput = {
  brideName: string;
  groomName: string;
  title?: string;
  description?: string;
  weddingDate: string;
  timeZone: string;
  location?: { formattedAddress?: string };
};

export type UpdateWeddingInput = Partial<
  Pick<
    CreateWeddingInput,
    'brideName' | 'groomName' | 'weddingDate' | 'timeZone'
  >
> & {
  title?: string | null;
  description?: string | null;
  location?: { formattedAddress?: string } | null;
};

type WeddingContextResponse = {
  data: { wedding: Wedding; membership: WeddingMembership };
};

export async function createWedding(input: CreateWeddingInput) {
  const response = await apiRequest<WeddingContextResponse>('/api/wedding', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function updateWedding(input: UpdateWeddingInput) {
  const response = await apiRequest<{ data: Wedding }>('/api/wedding', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return response.data;
}
