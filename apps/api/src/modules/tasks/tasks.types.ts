import type { WeddingMembershipRecord } from '../wedding/wedding.types.js';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskAssignee = {
  membershipId: string;
  name: string;
  role: 'ADMIN' | 'MANAGER';
};
export type TaskEvent = { id: string; name: string; archivedAt?: string };
export type TaskRecord = {
  id: string;
  title: string;
  description?: string;
  assignedMembershipId?: string;
  eventId?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  assignee: TaskAssignee | null;
  event: TaskEvent | null;
};
export type TaskInput = {
  title: string;
  description?: string | null;
  assignedMembershipId?: string | null;
  eventId?: string | null;
  dueDate?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
};
export type TaskUpdateInput = Partial<TaskInput> & {
  expectedUpdatedAt: string;
};
export type TaskListInput = {
  page: number;
  limit: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  eventId?: string | 'none';
  assignedMembershipId?: string | 'none';
  mine?: boolean;
};
export type TaskListResult = {
  data: TaskRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export interface TaskRepository {
  findMembership(userId: string): Promise<WeddingMembershipRecord | null>;
  findAssignableMembership(
    weddingId: string,
    membershipId: string,
  ): Promise<boolean>;
  findActiveEvent(weddingId: string, eventId: string): Promise<boolean>;
  list(
    weddingId: string,
    actorMembershipId: string,
    input: TaskListInput,
  ): Promise<TaskListResult>;
  findById(weddingId: string, taskId: string): Promise<TaskRecord | null>;
  create(
    weddingId: string,
    input: TaskInput & { completedAt?: Date },
  ): Promise<TaskRecord>;
  update(
    weddingId: string,
    taskId: string,
    expectedUpdatedAt: string,
    input: Partial<TaskInput> & { completedAt?: Date | null },
  ): Promise<TaskRecord | null>;
  delete(weddingId: string, taskId: string): Promise<boolean>;
}
export interface TaskServiceContract {
  list(userId: string, input: TaskListInput): Promise<TaskListResult>;
  get(userId: string, taskId: string): Promise<TaskRecord>;
  create(userId: string, input: TaskInput): Promise<TaskRecord>;
  update(
    userId: string,
    taskId: string,
    input: TaskUpdateInput,
  ): Promise<TaskRecord>;
  delete(userId: string, taskId: string): Promise<void>;
}
