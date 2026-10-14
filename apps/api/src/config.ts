import { z } from 'zod';

const developmentRateLimitSecret =
  'development-only-rate-limit-key-change-before-production';

const result = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    MONGODB_URI: z.string().trim().min(1).optional(),
    APP_ORIGIN: z.url().default('http://localhost:5173'),
    SESSION_DURATION_DAYS: z.coerce.number().int().min(1).max(30).default(7),
    RATE_LIMIT_HMAC_SECRET: z
      .string()
      .min(32)
      .default(developmentRateLimitSecret),
  })
  .superRefine((value, context) => {
    if (
      value.NODE_ENV === 'production' &&
      value.RATE_LIMIT_HMAC_SECRET === developmentRateLimitSecret
    ) {
      context.addIssue({
        code: 'custom',
        path: ['RATE_LIMIT_HMAC_SECRET'],
        message: 'A unique secret is required in production.',
      });
    }
  })
  .safeParse(process.env);
if (!result.success) {
  throw new Error(
    `Invalid server configuration: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`,
  );
}
export const config = result.data;
