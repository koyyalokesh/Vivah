import mongoose from 'mongoose';

export const eventTypes = [
  'ROKA',
  'ENGAGEMENT',
  'MEHENDI',
  'HALDI',
  'SANGEET',
  'COCKTAIL',
  'WEDDING',
  'RECEPTION',
  'CUSTOM',
] as const;

const eventSchema = new mongoose.Schema(
  {
    weddingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Wedding',
    },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    type: { type: String, enum: eventTypes },
    startsAt: { type: Date, required: true },
    endsAt: Date,
    venueName: { type: String, trim: true, maxlength: 200 },
    address: { type: String, trim: true, maxlength: 500 },
    description: { type: String, trim: true, maxlength: 2000 },
    dressCode: { type: String, trim: true, maxlength: 200 },
    coverImageObjectKey: { type: String, select: false },
    archivedAt: Date,
  },
  { timestamps: true },
);

eventSchema.index({ weddingId: 1, archivedAt: 1, startsAt: 1, _id: 1 });

export const EventModel =
  mongoose.models.Event ?? mongoose.model('Event', eventSchema, 'events');
