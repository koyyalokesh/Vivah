import mongoose from 'mongoose';
import { EventModel } from '../events/event.model.js';
import { WeddingMembershipModel } from '../wedding/wedding-membership.model.js';
import type { WeddingMembershipRecord } from '../wedding/wedding.types.js';
import { TaskModel } from './task.model.js';
import type {
  TaskInput,
  TaskListInput,
  TaskRecord,
  TaskRepository,
} from './tasks.types.js';

function membership(value: unknown): WeddingMembershipRecord {
  const item = value as {
    _id: { toString(): string };
    userId: { toString(): string };
    weddingId: { toString(): string };
    role: 'ADMIN' | 'MANAGER';
    joinedAt: Date;
  };
  return {
    id: item._id.toString(),
    userId: item.userId.toString(),
    weddingId: item.weddingId.toString(),
    role: item.role,
    joinedAt: item.joinedAt,
  };
}
function task(value: unknown): TaskRecord {
  const item = value as {
    _id: { toString(): string };
    title: string;
    description?: string;
    assignedMembershipId?:
      | {
          _id: { toString(): string };
          role: 'ADMIN' | 'MANAGER';
          userId?: { name: string };
        }
      | { toString(): string };
    eventId?:
      | { _id: { toString(): string }; name: string; archivedAt?: Date }
      | { toString(): string };
    dueDate?: Date;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  const populatedAssignee =
    item.assignedMembershipId &&
    '_id' in item.assignedMembershipId &&
    'role' in item.assignedMembershipId
      ? item.assignedMembershipId
      : null;
  const populatedEvent =
    item.eventId && '_id' in item.eventId && 'name' in item.eventId
      ? item.eventId
      : null;
  const assignedMembershipId = item.assignedMembershipId
    ? '_id' in item.assignedMembershipId
      ? item.assignedMembershipId._id.toString()
      : item.assignedMembershipId.toString()
    : undefined;
  const eventId = item.eventId
    ? '_id' in item.eventId
      ? item.eventId._id.toString()
      : item.eventId.toString()
    : undefined;
  return {
    id: item._id.toString(),
    title: item.title,
    ...(item.description ? { description: item.description } : {}),
    ...(assignedMembershipId ? { assignedMembershipId } : {}),
    ...(eventId ? { eventId } : {}),
    ...(item.dueDate ? { dueDate: item.dueDate.toISOString() } : {}),
    priority: item.priority,
    status: item.status,
    ...(item.completedAt
      ? { completedAt: item.completedAt.toISOString() }
      : {}),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    assignee: populatedAssignee?.userId
      ? {
          membershipId: populatedAssignee._id.toString(),
          name: populatedAssignee.userId.name,
          role: populatedAssignee.role,
        }
      : null,
    event: populatedEvent
      ? {
          id: populatedEvent._id.toString(),
          name: populatedEvent.name,
          ...(populatedEvent.archivedAt
            ? { archivedAt: populatedEvent.archivedAt.toISOString() }
            : {}),
        }
      : null,
  };
}
function populated(query: ReturnType<typeof TaskModel.find>) {
  return query
    .populate({
      path: 'assignedMembershipId',
      select: 'role userId',
      transform: (document: unknown, originalId: unknown) =>
        document ?? originalId,
      populate: { path: 'userId', select: 'name' },
    })
    .populate('eventId', 'name archivedAt');
}
function operators(input: Partial<TaskInput> & { completedAt?: Date | null }) {
  const set: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === '') unset[key] = 1;
    else if (value !== undefined) set[key] = value;
  }
  return {
    ...(Object.keys(set).length ? { $set: set } : {}),
    ...(Object.keys(unset).length ? { $unset: unset } : {}),
  };
}

export class MongooseTaskRepository implements TaskRepository {
  async findMembership(userId: string) {
    const value = await WeddingMembershipModel.findOne({ userId }).lean();
    return value ? membership(value) : null;
  }
  async findAssignableMembership(weddingId: string, membershipId: string) {
    return (
      mongoose.isValidObjectId(membershipId) &&
      Boolean(
        await WeddingMembershipModel.exists({ _id: membershipId, weddingId }),
      )
    );
  }
  async findActiveEvent(weddingId: string, eventId: string) {
    return (
      mongoose.isValidObjectId(eventId) &&
      Boolean(
        await EventModel.exists({
          _id: eventId,
          weddingId,
          archivedAt: { $exists: false },
        }),
      )
    );
  }
  async list(
    weddingId: string,
    actorMembershipId: string,
    input: TaskListInput,
  ) {
    const filter: Record<string, unknown> = { weddingId };
    if (input.status) filter.status = input.status;
    if (input.priority) filter.priority = input.priority;
    if (input.eventId)
      filter.eventId =
        input.eventId === 'none' ? { $exists: false } : input.eventId;
    if (input.assignedMembershipId)
      filter.assignedMembershipId =
        input.assignedMembershipId === 'none'
          ? { $exists: false }
          : input.assignedMembershipId;
    if (input.mine) {
      if (
        input.assignedMembershipId &&
        input.assignedMembershipId !== actorMembershipId
      )
        filter._id = null;
      else filter.assignedMembershipId = actorMembershipId;
    }
    const skip = (input.page - 1) * input.limit;
    const [values, total] = await Promise.all([
      populated(TaskModel.find(filter))
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(input.limit)
        .lean(),
      TaskModel.countDocuments(filter),
    ]);
    return {
      data: values.map(task),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    };
  }
  async findById(weddingId: string, taskId: string) {
    if (!mongoose.isValidObjectId(taskId)) return null;
    const value = await populated(TaskModel.find({ _id: taskId, weddingId }))
      .findOne()
      .lean();
    return value ? task(value) : null;
  }
  async create(weddingId: string, input: TaskInput & { completedAt?: Date }) {
    const value = await TaskModel.create({ weddingId, ...input });
    return (await this.findById(weddingId, value._id.toString()))!;
  }
  async update(
    weddingId: string,
    taskId: string,
    expectedUpdatedAt: string,
    input: Partial<TaskInput> & { completedAt?: Date | null },
  ) {
    if (!mongoose.isValidObjectId(taskId)) return null;
    const value = await TaskModel.findOneAndUpdate(
      { _id: taskId, weddingId, updatedAt: new Date(expectedUpdatedAt) },
      operators(input),
      { returnDocument: 'after', runValidators: true },
    ).lean();
    return value ? this.findById(weddingId, taskId) : null;
  }
  async delete(weddingId: string, taskId: string) {
    if (!mongoose.isValidObjectId(taskId)) return false;
    const value = await TaskModel.deleteOne({ _id: taskId, weddingId });
    return value.deletedCount === 1;
  }
}
