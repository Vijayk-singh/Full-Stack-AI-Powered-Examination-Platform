import mongoose, { Schema, Document } from 'mongoose';

export interface IOAssessment extends Document {
  title: string;
  description: string;
  duration: number; // in minutes
  mcqQuestions: mongoose.Types.ObjectId[]; // refs to Question
  dsaQuestions: mongoose.Types.ObjectId[]; // refs to DSAQuestion
  allowedPlans: mongoose.Types.ObjectId[]; // refs to SubscriptionPlan
  invitedStudents: string[]; // array of emails
  isLeaderboardPublic: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OAssessmentSchema = new Schema<IOAssessment>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true, default: 60 },
    mcqQuestions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    dsaQuestions: [{ type: Schema.Types.ObjectId, ref: 'DSAQuestion' }],
    allowedPlans: [{ type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' }],
    invitedStudents: [{ type: String }],
    isLeaderboardPublic: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export default mongoose.models.OAssessment || mongoose.model<IOAssessment>('OAssessment', OAssessmentSchema);
