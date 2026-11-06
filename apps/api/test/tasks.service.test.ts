import { describe, expect, it } from 'vitest';
import { TaskService } from '../src/modules/tasks/tasks.service.js';
import type {
  TaskInput,
  TaskListInput,
  TaskRecord,
  TaskRepository,
} from '../src/modules/tasks/tasks.types.js';
import type { WeddingMembershipRecord } from '../src/modules/wedding/wedding.types.js';
const record: TaskRecord = {
  id: 'task-1',
  title: 'Finalize photographer',
  priority: 'HIGH',
  status: 'TODO',
  createdAt: '2026-11-05T00:00:00.000Z',
  updatedAt: '2026-11-05T00:00:00.000Z',
  assignee: null,
  event: null,
};
class FakeTasks implements TaskRepository {
  membership: WeddingMembershipRecord | null = {
    id: 'member-1',
    userId: 'user-1',
    weddingId: 'wedding-1',
    role: 'MANAGER',
    joinedAt: new Date(),
  };
  task: TaskRecord | null = record;
  memberValid = true;
  eventValid = true;
  updateFails = false;
  requestedWedding = '';
  createdInput: (TaskInput & { completedAt?: Date }) | null = null;
  async findMembership() {
    return this.membership;
  }
  async findAssignableMembership(w: string) {
    this.requestedWedding = w;
    return this.memberValid;
  }
  async findActiveEvent(w: string) {
    this.requestedWedding = w;
    return this.eventValid;
  }
  async list(w: string, _a: string, input: TaskListInput) {
    this.requestedWedding = w;
    return {
      data: this.task ? [this.task] : [],
      pagination: {
        page: input.page,
        limit: input.limit,
        total: this.task ? 1 : 0,
        totalPages: this.task ? 1 : 0,
      },
    };
  }
  async findById(w: string) {
    this.requestedWedding = w;
    return this.task;
  }
  async create(w: string, input: TaskInput & { completedAt?: Date }) {
    this.requestedWedding = w;
    this.createdInput = input;
    return {
      ...record,
      ...input,
      priority: input.priority ?? 'MEDIUM',
      status: input.status ?? 'TODO',
      completedAt: input.completedAt?.toISOString(),
      updatedAt: record.updatedAt,
      createdAt: record.createdAt,
      assignee: null,
      event: null,
    };
  }
  async update(
    w: string,
    _id: string,
    _version: string,
    input: Partial<TaskInput> & { completedAt?: Date | null },
  ) {
    this.requestedWedding = w;
    if (this.updateFails || !this.task) return null;
    this.task = {
      ...this.task,
      ...input,
      completedAt:
        input.completedAt === null
          ? undefined
          : (input.completedAt?.toISOString() ?? this.task.completedAt),
      updatedAt: '2026-11-05T01:00:00.000Z',
    };
    return this.task;
  }
  async delete(w: string) {
    this.requestedWedding = w;
    if (!this.task) return false;
    this.task = null;
    return true;
  }
}
describe('TaskService', () => {
  it('derives list scope from membership', async () => {
    const repo = new FakeTasks();
    await new TaskService(repo).list('user-1', { page: 1, limit: 20 });
    expect(repo.requestedWedding).toBe('wedding-1');
  });
  it('rejects an assignee from another wedding', async () => {
    const repo = new FakeTasks();
    repo.memberValid = false;
    await expect(
      new TaskService(repo).create('user-1', {
        title: 'Task',
        assignedMembershipId: 'member-2',
      }),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });
  it('rejects an archived or cross-wedding event', async () => {
    const repo = new FakeTasks();
    repo.eventValid = false;
    await expect(
      new TaskService(repo).create('user-1', {
        title: 'Task',
        eventId: 'event-2',
      }),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });
  it('omits empty optional fields when creating an unassigned task', async () => {
    const repo = new FakeTasks();
    await new TaskService(repo).create('user-1', {
      title: 'Task',
      description: null,
      assignedMembershipId: null,
      eventId: null,
      dueDate: null,
    });
    expect(repo.createdInput).toMatchObject({
      title: 'Task',
      description: undefined,
      assignedMembershipId: undefined,
      eventId: undefined,
      dueDate: undefined,
    });
  });
  it('sets completion time and clears it when reopened', async () => {
    const repo = new FakeTasks();
    const service = new TaskService(repo);
    const completed = await service.update('user-1', 'task-1', {
      status: 'COMPLETED',
      expectedUpdatedAt: record.updatedAt,
    });
    expect(completed.completedAt).toBeTruthy();
    const reopened = await service.update('user-1', 'task-1', {
      status: 'TODO',
      expectedUpdatedAt: completed.updatedAt,
    });
    expect(reopened.completedAt).toBeUndefined();
  });
  it('reports stale update conflicts', async () => {
    const repo = new FakeTasks();
    repo.updateFails = true;
    await expect(
      new TaskService(repo).update('user-1', 'task-1', {
        title: 'Changed',
        expectedUpdatedAt: record.updatedAt,
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' });
  });
  it('preserves a removed-member assignment on unrelated edits', async () => {
    const repo = new FakeTasks();
    repo.task = {
      ...record,
      assignedMembershipId: 'removed-member-1',
    };
    repo.memberValid = false;
    const updated = await new TaskService(repo).update('user-1', 'task-1', {
      title: 'Updated title',
      assignedMembershipId: 'removed-member-1',
      expectedUpdatedAt: record.updatedAt,
    });
    expect(updated.assignedMembershipId).toBe('removed-member-1');
    expect(updated.title).toBe('Updated title');
  });
  it('hard deletes only in the actor wedding', async () => {
    const repo = new FakeTasks();
    await new TaskService(repo).delete('user-1', 'task-1');
    expect(repo.requestedWedding).toBe('wedding-1');
    expect(repo.task).toBeNull();
  });
  it('returns not found without membership', async () => {
    const repo = new FakeTasks();
    repo.membership = null;
    await expect(
      new TaskService(repo).get('user-1', 'task-1'),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });
});
