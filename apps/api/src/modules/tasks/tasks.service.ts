import { AppError } from '../../shared/app-error.js';
import { MongooseTaskRepository } from './tasks.repository.js';
import type {
  TaskInput,
  TaskListInput,
  TaskRepository,
  TaskServiceContract,
  TaskUpdateInput,
} from './tasks.types.js';

export class TaskService implements TaskServiceContract {
  constructor(private readonly tasks: TaskRepository) {}
  private async actor(userId: string) {
    const actor = await this.tasks.findMembership(userId);
    if (!actor || !['ADMIN', 'MANAGER'].includes(actor.role))
      throw new AppError(404, 'NOT_FOUND', 'Wedding not found.');
    return actor;
  }
  private async associations(
    weddingId: string,
    input: Partial<TaskInput>,
    existing?: { assignedMembershipId?: string; eventId?: string },
  ) {
    if (
      input.assignedMembershipId &&
      input.assignedMembershipId !== existing?.assignedMembershipId &&
      !(await this.tasks.findAssignableMembership(
        weddingId,
        input.assignedMembershipId,
      ))
    )
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Select a current wedding member.',
        { assignedMembershipId: ['Select a current wedding member.'] },
      );
    if (
      input.eventId &&
      input.eventId !== existing?.eventId &&
      !(await this.tasks.findActiveEvent(weddingId, input.eventId))
    )
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Select an active wedding event.',
        { eventId: ['Select an active wedding event.'] },
      );
  }
  async list(userId: string, input: TaskListInput) {
    const actor = await this.actor(userId);
    return this.tasks.list(actor.weddingId, actor.id, input);
  }
  async get(userId: string, taskId: string) {
    const actor = await this.actor(userId);
    const task = await this.tasks.findById(actor.weddingId, taskId);
    if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found.');
    return task;
  }
  async create(userId: string, input: TaskInput) {
    const actor = await this.actor(userId);
    await this.associations(actor.weddingId, input);
    return this.tasks.create(actor.weddingId, {
      ...input,
      description: input.description || undefined,
      assignedMembershipId: input.assignedMembershipId || undefined,
      eventId: input.eventId || undefined,
      dueDate: input.dueDate || undefined,
      priority: input.priority ?? 'MEDIUM',
      status: input.status ?? 'TODO',
      ...(input.status === 'COMPLETED' ? { completedAt: new Date() } : {}),
    });
  }
  async update(userId: string, taskId: string, input: TaskUpdateInput) {
    const actor = await this.actor(userId);
    const existing = await this.tasks.findById(actor.weddingId, taskId);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Task not found.');
    await this.associations(actor.weddingId, input, existing);
    const { expectedUpdatedAt, ...changes } = input;
    let completedAt: Date | null | undefined;
    if (changes.status === 'COMPLETED' && existing.status !== 'COMPLETED')
      completedAt = new Date();
    if (
      changes.status &&
      changes.status !== 'COMPLETED' &&
      existing.status === 'COMPLETED'
    )
      completedAt = null;
    const updated = await this.tasks.update(
      actor.weddingId,
      taskId,
      expectedUpdatedAt,
      { ...changes, ...(completedAt !== undefined ? { completedAt } : {}) },
    );
    if (!updated)
      throw new AppError(
        409,
        'CONFLICT',
        'This task changed. Reload it before trying again.',
      );
    return updated;
  }
  async delete(userId: string, taskId: string) {
    const actor = await this.actor(userId);
    if (!(await this.tasks.delete(actor.weddingId, taskId)))
      throw new AppError(404, 'NOT_FOUND', 'Task not found.');
  }
}
export const taskService = new TaskService(new MongooseTaskRepository());
