import { z } from 'zod';

const email = z
  .string()
  .trim()
  .max(254, 'Email is too long.')
  .pipe(z.email('Enter a valid email address.'));
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password must be at most 128 characters.');

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must be at most 100 characters.'),
  email,
  password,
});

export const loginSchema = z.object({ email, password });
