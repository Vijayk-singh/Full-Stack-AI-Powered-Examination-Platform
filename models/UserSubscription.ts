import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

const UserSubscriptionSchema = new Schema<IUserSubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

UserSubscriptionSchema.index({ userId: 1, status: 1 });

export default mongoose.models.UserSubscription || mongoose.model<IUserSubscription>('UserSubscription', UserSubscriptionSchema);
