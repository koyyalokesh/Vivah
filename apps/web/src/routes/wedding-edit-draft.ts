export type WeddingEditValues = {
  brideName: string;
  groomName: string;
  title: string;
  weddingDate: string;
  timeZone: string;
  location: string;
  description: string;
};

export type WeddingEditField = keyof WeddingEditValues;

export type WeddingEditDraft = {
  version: 1;
  userId: string;
  weddingId: string;
  baseline: WeddingEditValues;
  values: WeddingEditValues;
};

export type WeddingDraftRecovery = {
  values: WeddingEditValues;
  recovered: boolean;
  conflicts: WeddingEditField[];
};

const fields: WeddingEditField[] = [
  'brideName',
  'groomName',
  'title',
  'weddingDate',
  'timeZone',
  'location',
  'description',
];

function normalized(value: string) {
  return value.trim();
}

function hasEditValues(value: unknown): value is WeddingEditValues {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<WeddingEditValues>;
  return (
    Object.keys(candidate).length === fields.length &&
    fields.every((field) => typeof candidate[field] === 'string')
  );
}

export function recoverWeddingEditDraft(
  value: unknown,
  serverValues: WeddingEditValues,
  userId: string,
  weddingId: string,
): WeddingDraftRecovery | null {
  if (!value || typeof value !== 'object') return null;
  const draft = value as Partial<WeddingEditDraft>;
  if (
    draft.version !== 1 ||
    draft.userId !== userId ||
    draft.weddingId !== weddingId ||
    !hasEditValues(draft.baseline) ||
    !hasEditValues(draft.values)
  ) {
    return null;
  }

  const merged = { ...serverValues };
  const conflicts: WeddingEditField[] = [];
  let recovered = false;

  for (const field of fields) {
    const draftValue = normalized(draft.values[field]);
    const originalValue = normalized(draft.baseline[field]);
    const serverValue = normalized(serverValues[field]);
    if (draftValue === originalValue) continue;

    if (serverValue !== originalValue && serverValue !== draftValue) {
      conflicts.push(field);
      continue;
    }

    merged[field] = draft.values[field];
    recovered = recovered || serverValue !== draftValue;
  }

  return { values: merged, recovered, conflicts };
}
