import { z } from 'zod';

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254, 'Email is too long.')
    .pipe(z.email('Enter a valid email address.')),
  role: z.enum(['ADMIN', 'MANAGER']),
});

export const changeMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER']),
});

export const objectIdParamsSchema = z.object({
  membershipId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid member identifier.'),
});

export const invitationIdParamsSchema = z.object({
  invitationId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid invitation identifier.'),
});

export const tokenParamsSchema = z.object({
  token: z
    .string()
    .min(40)
    .max(100)
    .regex(/^[A-Za-z0-9_-]+$/, 'Invalid invitation token.'),
});
