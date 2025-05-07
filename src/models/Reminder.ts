import mongoose, { Schema, Document } from 'mongoose';

export interface ReminderType extends Document {
  leadId: mongoose.Types.ObjectId;
  scheduledTime: Date;
  status: 'pending' | 'completed' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

const ReminderSchema = new Schema<ReminderType>(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'dismissed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Create index for efficient querying of pending reminders
ReminderSchema.index({ status: 1, scheduledTime: 1 });

export const Reminder = mongoose.models.Reminder || mongoose.model<ReminderType>('Reminder', ReminderSchema); 