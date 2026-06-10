import mongoose, { Schema, Document } from 'mongoose';

export interface ITopic extends Document {
  subjectId: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Ensure name is unique per subject
TopicSchema.index({ subjectId: 1, name: 1 }, { unique: true });

export default mongoose.models.Topic || mongoose.model<ITopic>('Topic', TopicSchema);
