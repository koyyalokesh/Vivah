const publicAuthPaths = new Set(['/login', '/signup']);

export function getAuthReturnPath(state: unknown, fallback = '/app') {
  if (!state || typeof state !== 'object' || !('from' in state)) {
    return fallback;
  }

  const from = state.from;
  if (
    typeof from !== 'string' ||
    !from.startsWith('/') ||
    from.startsWith('//') ||
    publicAuthPaths.has(from)
  ) {
    return fallback;
  }

  return from;
}
