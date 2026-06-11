import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  name: string;
  description?: string;
  price: number;
  availableTests: mongoose.Types.ObjectId[];
  expiryDate?: Date; // absolute expiry date
  durationDays?: number; // relative duration in days (e.g. 30 days)
  attemptsPerTest: number; // max attempts per test in this plan
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    availableTests: [{ type: Schema.Types.ObjectId, ref: 'Test' }],
    expiryDate: { type: Date },
    durationDays: { type: Number, default: 30 },
    attemptsPerTest: { type: Number, required: true, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.SubscriptionPlan || mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
