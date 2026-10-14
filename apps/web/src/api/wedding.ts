import { apiRequest, type Wedding, type WeddingMembership } from './auth';

export type CreateWeddingInput = {
  brideName: string;
  groomName: string;
  title: string;
  description?: string;
  weddingDate: string;
  timeZone: string;
  location?: { formattedAddress?: string };
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
