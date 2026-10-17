import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    formattedAddress: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    latitude: Number,
    longitude: Number,
    googlePlaceId: { type: String, trim: true },
  },
  { _id: false },
);

const weddingSchema = new mongoose.Schema(
  {
    brideName: { type: String, required: true, trim: true },
    groomName: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    weddingDate: { type: String, required: true },
    timeZone: { type: String, required: true },
    coverImageObjectKey: { type: String, select: false },
    location: locationSchema,
    website: {
      slug: { type: String, required: true },
      theme: { type: String, required: true, default: 'classic' },
      isPublished: { type: Boolean, required: true, default: false },
      welcomeMessage: String,
    },
    gallery: {
      tokenHash: { type: String, select: false },
      isEnabled: { type: Boolean, required: true, default: false },
      guestUploadsEnabled: { type: Boolean, required: true, default: false },
    },
    livestream: {
      youtubeUrl: { type: String, default: null },
      isEnabled: { type: Boolean, required: true, default: false },
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    deletedAt: Date,
  },
  { timestamps: true },
);

weddingSchema.index({ 'website.slug': 1 }, { unique: true });
weddingSchema.index({ createdAt: 1 });

export const WeddingModel =
  mongoose.models.Wedding ??
  mongoose.model('Wedding', weddingSchema, 'weddings');
