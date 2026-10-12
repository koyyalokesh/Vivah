import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  const type =
    typeof error === 'object' && error !== null && 'type' in error
      ? error.type
      : undefined;
  if (type === 'entity.parse.failed') {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body.' },
    });
    return;
  }
  if (type === 'entity.too.large') {
    res.status(413).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body is too large.',
      },
    });
    return;
  }
  console.error('Unexpected API error.');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
};
