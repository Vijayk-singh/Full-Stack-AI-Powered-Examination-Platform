import mongoose, { Schema, Document } from 'mongoose';

export type TestStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';
export type TestType = 'PRACTICE' | 'SCHEDULED' | 'INSTANT';

export interface ITest extends Document {
  title: string;
  description?: string;
  subjectId: mongoose.Types.ObjectId;
  duration: number; // in minutes
  questions: mongoose.Types.ObjectId[];
  startDate?: Date; // required for SCHEDULED
  endDate?: Date;   // required for SCHEDULED
  totalMarks: number;
  createdBy: mongoose.Types.ObjectId;
  status: TestStatus;
  testType: TestType;
  attemptsAllowed: number; // 0 for unlimited
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestSchema = new Schema<ITest>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    duration: { type: Number, required: true, default: 60 }, // minutes
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    startDate: { type: Date },
    endDate: { type: Date },
    totalMarks: { type: Number, required: true, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
      type: String, 
      enum: ['DRAFT', 'PUBLISHED', 'UNPUBLISHED'], 
      default: 'DRAFT' 
    },
    testType: { 
      type: String, 
      enum: ['PRACTICE', 'SCHEDULED', 'INSTANT'], 
      default: 'PRACTICE' 
    },
    attemptsAllowed: { type: Number, default: 5 }, // default 1 attempt
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Test || mongoose.model<ITest>('Test', TestSchema);
