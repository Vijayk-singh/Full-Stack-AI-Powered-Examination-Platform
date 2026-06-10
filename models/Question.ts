import mongoose, { Schema, Document } from 'mongoose';

export type QuestionType = 'MCQ' | 'MULTIPLE_CORRECT' | 'TRUE_FALSE' | 'NUMERICAL' | 'SUBJECTIVE';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface IQuestion extends Document {
  questionText: string;
  type: QuestionType;
  options: string[]; // Used for MCQ, MULTIPLE_CORRECT, and TRUE_FALSE (e.g. ["True", "False"])
  correctAnswer: any; // E.g., number index (MCQ), number indexes array (MULTIPLE_CORRECT), "true"/"false" (TRUE_FALSE), number/text (NUMERICAL), criteria string (SUBJECTIVE)
  explanation?: string;
  difficulty: DifficultyLevel;
  subjectId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  marks: number;
  negativeMarks: number;
  imageUrl?: string;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    questionText: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['MCQ', 'MULTIPLE_CORRECT', 'TRUE_FALSE', 'NUMERICAL', 'SUBJECTIVE'], 
      default: 'MCQ' 
    },
    options: [{ type: String }],
    correctAnswer: { type: Schema.Types.Mixed, required: true },
    explanation: { type: String, default: '' },
    difficulty: { 
      type: String, 
      enum: ['EASY', 'MEDIUM', 'HARD'], 
      default: 'MEDIUM' 
    },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    marks: { type: Number, required: true, default: 1 },
    negativeMarks: { type: Number, required: true, default: 0 },
    imageUrl: { type: String, default: '' },
    tags: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
