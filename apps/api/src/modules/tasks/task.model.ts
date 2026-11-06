import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    weddingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Wedding',
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    assignedMembershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WeddingMembership',
    },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    dueDate: Date,
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      required: true,
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
      required: true,
      default: 'TODO',
    },
    completedAt: Date,
  },
  { timestamps: true },
);

taskSchema.index({ weddingId: 1, status: 1 });
taskSchema.index({ weddingId: 1, dueDate: 1 });
taskSchema.index({ weddingId: 1, assignedMembershipId: 1, status: 1 });
taskSchema.index({ weddingId: 1, eventId: 1 });

export const TaskModel =
  mongoose.models.Task ?? mongoose.model('Task', taskSchema, 'tasks');
