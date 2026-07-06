import mongoose, { Schema, Document } from 'mongoose';

export interface IOAssessmentAttempt extends Document {
  assessmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  mcqAnswers: {
    questionId: mongoose.Types.ObjectId;
    selectedOption: number;
    isCorrect: boolean;
  }[];
  dsaSubmissions: {
    questionId: mongoose.Types.ObjectId;
    language: string;
    code: string;
    passedTestCases: number;
    totalTestCases: number;
    score: number;
  }[];
  totalScore: number;
  startedAt: Date;
  completedAt?: Date;
}

const OAssessmentAttemptSchema = new Schema<IOAssessmentAttempt>(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: 'OAssessment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['IN_PROGRESS', 'SUBMITTED'], default: 'IN_PROGRESS' },
    mcqAnswers: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
        selectedOption: { type: Number },
        isCorrect: { type: Boolean, default: false }
      }
    ],
    dsaSubmissions: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: 'DSAQuestion' },
        language: { type: String },
        code: { type: String },
        passedTestCases: { type: Number, default: 0 },
        totalTestCases: { type: Number, default: 0 },
        score: { type: Number, default: 0 }
      }
    ],
    totalScore: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.models.OAssessmentAttempt || mongoose.model<IOAssessmentAttempt>('OAssessmentAttempt', OAssessmentAttemptSchema);
