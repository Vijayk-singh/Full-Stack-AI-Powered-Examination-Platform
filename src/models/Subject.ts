import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);
