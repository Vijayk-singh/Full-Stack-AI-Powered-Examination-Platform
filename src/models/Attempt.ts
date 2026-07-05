import mongoose, { Schema, Document } from 'mongoose';

export interface ISingleAnswer {
  questionId: mongoose.Types.ObjectId;
  answer: any; // index, array of indexes, numerical string, or subjective text
  isCorrect?: boolean;
  marksObtained?: number;
  feedback?: string;
}

export interface IAttempt extends Document {
  studentId: mongoose.Types.ObjectId;
  testId: mongoose.Types.ObjectId;
  answers: ISingleAnswer[];
  score: number;
  accuracy: number; // percentage
  completionTime: number; // in seconds
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SingleAnswerSchema = new Schema<ISingleAnswer>({
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  answer: { type: Schema.Types.Mixed, required: true },
  isCorrect: { type: Boolean },
  marksObtained: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
});

const AttemptSchema = new Schema<IAttempt>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
    answers: [SingleAnswerSchema],
    score: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    completionTime: { type: Number, default: 0 }, // in seconds
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compounding indexes for student analytics search speed
AttemptSchema.index({ studentId: 1, testId: 1 });

export default mongoose.models.Attempt || mongoose.model<IAttempt>('Attempt', AttemptSchema);
