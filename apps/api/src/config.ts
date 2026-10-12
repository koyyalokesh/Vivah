import { z } from 'zod';

const result = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
  })
  .safeParse(process.env);
if (!result.success) {
  throw new Error(
    `Invalid server configuration: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`,
  );
}
export const config = result.data;
