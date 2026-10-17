import { Router } from 'express';
import {
  requireAuthentication,
  verifyRequestOrigin,
} from '../auth/auth.middleware.js';
import type { AuthServiceContract } from '../auth/auth.types.js';
import { createMembersController } from './members.controller.js';
import type { MemberServiceContract } from './members.types.js';

export function createMembersRouter(
  auth: AuthServiceContract,
  members: MemberServiceContract,
) {
  const router = Router();
  const controller = createMembersController(members);
  const requireAuth = requireAuthentication(auth);
  const requireInvitationAuth = requireAuthentication<{ invitationId: string }>(
    auth,
  );
  const requireTokenAuth = requireAuthentication<{ token: string }>(auth);
  const requireMembershipAuth = requireAuthentication<{ membershipId: string }>(
    auth,
  );
  router.get('/members', requireAuth, controller.list);
  router.get('/members/invitations', requireAuth, controller.listInvitations);
  router.post(
    '/members/invitations',
    verifyRequestOrigin,
    requireAuth,
    controller.invite,
  );
  router.delete(
    '/members/invitations/:invitationId',
    verifyRequestOrigin,
    requireInvitationAuth,
    controller.revoke,
  );
  router.get('/public/member-invitations/:token', controller.publicInvitation);
  router.post(
    '/member-invitations/:token/accept',
    verifyRequestOrigin,
    requireTokenAuth,
    controller.accept,
  );
  router.patch(
    '/members/:membershipId',
    verifyRequestOrigin,
    requireMembershipAuth,
    controller.changeRole,
  );
  router.delete(
    '/members/:membershipId',
    verifyRequestOrigin,
    requireMembershipAuth,
    controller.remove,
  );
  return router;
}
