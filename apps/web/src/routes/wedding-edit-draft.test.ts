import { describe, expect, it } from 'vitest';
import {
  recoverWeddingEditDraft,
  type WeddingEditDraft,
  type WeddingEditValues,
} from './wedding-edit-draft';

const serverValues: WeddingEditValues = {
  brideName: 'Asha',
  groomName: 'Ravi',
  title: 'Asha & Ravi\u2019s Wedding',
  weddingDate: '2027-01-15',
  timeZone: 'Asia/Kolkata',
  location: 'Mumbai',
  description: 'Latest saved description',
};

function draft(overrides: Partial<WeddingEditDraft> = {}): WeddingEditDraft {
  const baseline = { ...serverValues, description: 'Original description' };
  return {
    version: 1,
    userId: 'user-1',
    weddingId: 'wedding-1',
    baseline,
    values: { ...baseline, location: 'Goa' },
    ...overrides,
  };
}

describe('recoverWeddingEditDraft', () => {
  it('restores edited fields while retaining unrelated newer server values', () => {
    const recovery = recoverWeddingEditDraft(
      draft(),
      serverValues,
      'user-1',
      'wedding-1',
    );

    expect(recovery).toEqual({
      values: { ...serverValues, location: 'Goa' },
      recovered: true,
      conflicts: [],
    });
  });

  it('keeps the server value when the same field changed in both places', () => {
    const changedServer = { ...serverValues, location: 'Delhi' };
    const recovery = recoverWeddingEditDraft(
      draft(),
      changedServer,
      'user-1',
      'wedding-1',
    );

    expect(recovery?.values.location).toBe('Delhi');
    expect(recovery?.conflicts).toEqual(['location']);
  });

  it('rejects a draft owned by another user', () => {
    expect(
      recoverWeddingEditDraft(draft(), serverValues, 'user-2', 'wedding-1'),
    ).toBeNull();
  });

  it('rejects a draft belonging to another wedding', () => {
    expect(
      recoverWeddingEditDraft(draft(), serverValues, 'user-1', 'wedding-2'),
    ).toBeNull();
  });
});
