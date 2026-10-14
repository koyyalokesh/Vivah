import type { RequestHandler } from 'express';
import { config } from '../../config.js';
import { AppError } from '../../shared/app-error.js';
import type { AuthLocals } from './auth.middleware.js';
import { sessionCookieName } from './auth.middleware.js';
import type {
  AuthServiceContract,
  CurrentWeddingContextReader,
} from './auth.types.js';
import { loginSchema, signupSchema } from './auth.validation.js';

function validationError(error: {
  flatten(): { fieldErrors: Record<string, string[]> };
}) {
  return new AppError(
    400,
    'VALIDATION_ERROR',
    'Please correct the highlighted fields.',
    error.flatten().fieldErrors,
  );
}

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires,
  };
}

export function createAuthController(
  service: AuthServiceContract,
  weddingContext: CurrentWeddingContextReader,
) {
  const signup: RequestHandler = async (req, res, next) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      next(validationError(parsed.error));
      return;
    }

    try {
      const result = await service.signup(parsed.data);
      res.cookie(
        sessionCookieName,
        result.sessionToken,
        cookieOptions(result.expiresAt),
      );
      res.status(201).json({
        data: {
          user: result.user,
          hasWedding: false,
          membership: null,
          wedding: null,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  const login: RequestHandler = async (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      next(validationError(parsed.error));
      return;
    }

    try {
      const result = await service.login(parsed.data);
      let context;
      try {
        context = await weddingContext.getContextForUser(result.user.id);
      } catch (error) {
        try {
          await service.logout(result.sessionToken);
        } catch {
          // Preserve the original context error while the session expires by TTL.
        }
        throw error;
      }
      res.cookie(
        sessionCookieName,
        result.sessionToken,
        cookieOptions(result.expiresAt),
      );
      res.json({
        data: {
          user: result.user,
          hasWedding: Boolean(context),
          membership: context?.membership ?? null,
          wedding: context?.wedding ?? null,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  const logout: RequestHandler = async (req, res, next) => {
    try {
      await service.logout(req.cookies[sessionCookieName]);
      res.clearCookie(sessionCookieName, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  const me: RequestHandler<
    Record<string, never>,
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (_req, res, next) => {
    try {
      const context = await weddingContext.getContextForUser(
        res.locals.user.id,
      );
      res.set('Cache-Control', 'no-store').json({
        data: {
          user: res.locals.user,
          membership: context?.membership ?? null,
          wedding: context?.wedding ?? null,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  return { signup, login, logout, me };
}
