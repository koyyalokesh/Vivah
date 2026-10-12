export async function getHealth(signal: AbortSignal): Promise<void> {
  const response = await fetch('/api/health', {
    signal,
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error('API unavailable.');
  const body: unknown = await response.json();
  if (
    typeof body !== 'object' ||
    body === null ||
    !('data' in body) ||
    typeof body.data !== 'object' ||
    body.data === null ||
    !('status' in body.data) ||
    body.data.status !== 'ok'
  ) {
    throw new Error('Unexpected health response.');
  }
}
