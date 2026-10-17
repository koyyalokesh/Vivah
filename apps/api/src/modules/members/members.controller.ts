import type { RequestHandler } from 'express';
import { AppError } from '../../shared/app-error.js';
import type { AuthLocals } from '../auth/auth.middleware.js';
import type { MemberServiceContract } from './members.types.js';
import {
  changeMemberRoleSchema,
  invitationIdParamsSchema,
  inviteMemberSchema,
  objectIdParamsSchema,
  tokenParamsSchema,
} from './members.validation.js';

function invitationResponse(value: {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER';
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  expiresAt: Date;
}) {
  return {
    id: value.id,
    email: value.email,
    role: value.role,
    status: value.status,
    expiresAt: value.expiresAt,
  };
}

function invalid(error: {
  flatten(): { fieldErrors: Record<string, string[]> };
}) {
  return new AppError(
    400,
    'VALIDATION_ERROR',
    'Please correct the highlighted fields.',
    error.flatten().fieldErrors,
  );
}

export function createMembersController(service: MemberServiceContract) {
  const list: RequestHandler<
    Record<string, never>,
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (_req, res, next) => {
    try {
      res
        .set('Cache-Control', 'no-store')
        .json({ data: await service.listMembers(res.locals.user.id) });
    } catch (error) {
      next(error);
    }
  };
  const invite: RequestHandler<
    Record<string, never>,
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (req, res, next) => {
    const parsed = inviteMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      next(invalid(parsed.error));
      return;
    }
    try {
      const invitation = await service.invite(res.locals.user, parsed.data);
      res.status(201).json({ data: invitationResponse(invitation) });
    } catch (error) {
      next(error);
    }
  };
  const listInvitations: RequestHandler<
    Record<string, never>,
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (_req, res, next) => {
    try {
      const invitations = await service.listInvitations(res.locals.user.id);
      res
        .set('Cache-Control', 'no-store')
        .json({ data: invitations.map(invitationResponse) });
    } catch (error) {
      next(error);
    }
  };
  const revoke: RequestHandler<
    { invitationId: string },
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (req, res, next) => {
    const parsed = invitationIdParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      next(invalid(parsed.error));
      return;
    }
    try {
      await service.revokeInvitation(
        res.locals.user.id,
        parsed.data.invitationId,
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
  const publicInvitation: RequestHandler<{ token: string }> = async (
    req,
    res,
    next,
  ) => {
    const parsed = tokenParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      next(new AppError(404, 'INVALID_TOKEN', 'This invitation is not valid.'));
      return;
    }
    try {
      res
        .set('Cache-Control', 'no-store')
        .json({ data: await service.getPublicInvitation(parsed.data.token) });
    } catch (error) {
      next(error);
    }
  };
  const accept: RequestHandler<
    { token: string },
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (req, res, next) => {
    const parsed = tokenParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      next(new AppError(404, 'INVALID_TOKEN', 'This invitation is not valid.'));
      return;
    }
    try {
      res.json({
        data: await service.acceptInvitation(
          res.locals.user,
          parsed.data.token,
        ),
      });
    } catch (error) {
      next(error);
    }
  };
  const changeRole: RequestHandler<
    { membershipId: string },
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (req, res, next) => {
    const params = objectIdParamsSchema.safeParse(req.params);
    const body = changeMemberRoleSchema.safeParse(req.body);
    if (!params.success) {
      next(invalid(params.error));
      return;
    }
    if (!body.success) {
      next(invalid(body.error));
      return;
    }
    try {
      res.json({
        data: await service.changeRole(
          res.locals.user.id,
          params.data.membershipId,
          body.data.role,
        ),
      });
    } catch (error) {
      next(error);
    }
  };
  const remove: RequestHandler<
    { membershipId: string },
    unknown,
    unknown,
    unknown,
    AuthLocals
  > = async (req, res, next) => {
    const parsed = objectIdParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      next(invalid(parsed.error));
      return;
    }
    try {
      await service.removeMember(res.locals.user.id, parsed.data.membershipId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
  return {
    list,
    invite,
    listInvitations,
    revoke,
    publicInvitation,
    accept,
    changeRole,
    remove,
  };
}
