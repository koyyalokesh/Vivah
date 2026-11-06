import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Select a valid option.');
const nullableId = z.union([objectId, z.null()]).optional();
const optionalText = z
  .union([z.string().trim().max(2000), z.null()])
  .optional();
const instant = z.iso.datetime({ offset: true });
const fields = {
  title: z.string().trim().min(1, 'Enter a task title.').max(200),
  description: optionalText,
  assignedMembershipId: nullableId,
  eventId: nullableId,
  dueDate: z.union([instant, z.null()]).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
};
export const createTaskSchema = z.object(fields).strict();
export const updateTaskSchema = z
  .object({
    title: fields.title.optional(),
    description: fields.description,
    assignedMembershipId: fields.assignedMembershipId,
    eventId: fields.eventId,
    dueDate: fields.dueDate,
    priority: fields.priority,
    status: fields.status,
    expectedUpdatedAt: instant,
  })
  .strict()
  .refine(
    (value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt'),
    { message: 'Provide at least one task detail to update.', path: ['title'] },
  );
export const listTasksSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  eventId: z.union([objectId, z.literal('none')]).optional(),
  assignedMembershipId: z.union([objectId, z.literal('none')]).optional(),
  mine: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});
