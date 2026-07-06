import mongoose, { Schema, Document } from 'mongoose';

export interface IDSAQuestion extends Document {
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  languageTemplates: {
    language: string;
    code: string;
  }[];
  testCases: {
    input: string;
    output: string;
    isHidden: boolean;
  }[];
  constraints: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DSAQuestionSchema = new Schema<IDSAQuestion>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'MEDIUM' },
    languageTemplates: [
      {
        language: { type: String, required: true },
        code: { type: String, required: true }
      }
    ],
    testCases: [
      {
        input: { type: String, required: true },
        output: { type: String, required: true },
        isHidden: { type: Boolean, default: false }
      }
    ],
    constraints: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export default mongoose.models.DSAQuestion || mongoose.model<IDSAQuestion>('DSAQuestion', DSAQuestionSchema);
