import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';
export type UserStatus = 'active' | 'pending' | 'inactive';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: false }, // optional for OAuth or custom integrations if needed, but required for custom auth
    role: { type: String, enum: ['STUDENT', 'TEACHER', 'ADMIN'], default: 'STUDENT' },
    avatar: { type: String, default: '' },
    status: { type: String, enum: ['active', 'pending', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

// Prevent compiling model if it already exists
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
