import { describe, expect, it } from 'vitest';
import {
  loginSchema,
  signupSchema,
} from '../src/modules/auth/auth.validation.js';

describe('authentication validation', () => {
  it('trims email whitespace before validating signup input', () => {
    const result = signupSchema.parse({
      name: 'Asha Sharma',
      email: '  Asha@example.com  ',
      password: 'strong-password',
    });

    expect(result.email).toBe('Asha@example.com');
  });

  it('trims email whitespace before validating login input', () => {
    const result = loginSchema.parse({
      email: '\tasha@example.com\n',
      password: 'strong-password',
    });

    expect(result.email).toBe('asha@example.com');
  });

  it('still rejects an invalid email after trimming', () => {
    const result = loginSchema.safeParse({
      email: '  invalid  ',
      password: 'strong-password',
    });

    expect(result.success).toBe(false);
  });
});
