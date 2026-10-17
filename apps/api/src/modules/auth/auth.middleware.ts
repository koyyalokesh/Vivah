import type { RequestHandler } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import { config } from '../../config.js';
import { AppError } from '../../shared/app-error.js';
import type { AuthServiceContract, PublicUser } from './auth.types.js';

export const sessionCookieName = 'vivah_session';

export type AuthLocals = { user: PublicUser };

export function requireAuthentication<
  Params extends ParamsDictionary = ParamsDictionary,
>(
  service: AuthServiceContract,
): RequestHandler<Params, unknown, unknown, unknown, AuthLocals> {
  return async (req, res, next) => {
    try {
      const user = await service.authenticate(req.cookies[sessionCookieName]);
      if (!user) {
        next(new AppError(401, 'UNAUTHORIZED', 'Authentication is required.'));
        return;
      }
      res.locals.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const verifyRequestOrigin: RequestHandler = (req, _res, next) => {
  const origin = req.get('origin');
  const referer = req.get('referer');
  let suppliedOrigin = origin;

  if (!suppliedOrigin && referer) {
    try {
      suppliedOrigin = new URL(referer).origin;
    } catch {
      next(
        new AppError(403, 'INVALID_ORIGIN', 'Request origin is not allowed.'),
      );
      return;
    }
  }

  if (suppliedOrigin && suppliedOrigin !== new URL(config.APP_ORIGIN).origin) {
    next(new AppError(403, 'INVALID_ORIGIN', 'Request origin is not allowed.'));
    return;
  }

  if (config.NODE_ENV === 'production' && !suppliedOrigin) {
    next(new AppError(403, 'INVALID_ORIGIN', 'Request origin is required.'));
    return;
  }

  next();
};
