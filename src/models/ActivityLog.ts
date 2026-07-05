import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  userId?: mongoose.Types.ObjectId;
  role?: string;
  action: string;
  endpoint: string;
  method: string;
  details?: string;
  ipAddress?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: String },
    action: { type: String, required: true },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    details: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
