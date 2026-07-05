import mongoose, { Schema, Document } from 'mongoose';

export interface IAIReport extends Document {
  studentId: mongoose.Types.ObjectId;
  testId: mongoose.Types.ObjectId;
  attemptId: mongoose.Types.ObjectId;
  strengths: string[];
  weaknesses: string[];
  speedAccuracyAnalysis?: string;
  subjectAnalysis: any; // e.g. { "Math": { total: 10, correct: 8, score: 8, accuracy: 80 } }
  topicAnalysis: any;   // e.g. { "Algebra": { total: 5, correct: 4, accuracy: 80 } }
  recommendations: {
    suggestedTests: string[]; // titles or IDs of tests
    suggestedTopics: string[]; // names of topics
    suggestedRevisionPlan: string; // generated revision guide markdown
  };
  createdAt: Date;
  updatedAt: Date;
}

const AIReportSchema = new Schema<IAIReport>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
    attemptId: { type: Schema.Types.ObjectId, ref: 'Attempt', required: true },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    speedAccuracyAnalysis: { type: String, default: '' },
    subjectAnalysis: { type: Schema.Types.Mixed, default: {} },
    topicAnalysis: { type: Schema.Types.Mixed, default: {} },
    recommendations: {
      suggestedTests: [{ type: String }],
      suggestedTopics: [{ type: String }],
      suggestedRevisionPlan: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export default mongoose.models.AIReport || mongoose.model<IAIReport>('AIReport', AIReportSchema);
