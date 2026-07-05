import User, { IUser, UserRole } from '../models/User';
import { connectToDatabase } from '../lib/db';

export class UserRepository {
  async connect() {
    await connectToDatabase();
  }

  async findById(id: string): Promise<IUser | null> {
    await this.connect();
    return User.findById(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    await this.connect();
    return User.findOne({ email: email.toLowerCase() });
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    await this.connect();
    return User.findOne({ email: email.toLowerCase() }).select('+password');
  }

  async findByResetToken(token: string): Promise<IUser | null> {
    await this.connect();
    return User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    await this.connect();
    const user = new User(userData);
    return user.save();
  }

  async update(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    await this.connect();
    return User.findByIdAndUpdate(id, userData, { new: true });
  }

  async delete(id: string): Promise<IUser | null> {
    await this.connect();
    return User.findByIdAndDelete(id);
  }

  async list(filter: any = {}, limit = 50, skip = 0): Promise<IUser[]> {
    await this.connect();
    return User.find(filter).sort({ createdAt: -1 }).limit(limit).skip(skip);
  }

  async count(filter: any = {}): Promise<number> {
    await this.connect();
    return User.countDocuments(filter);
  }
}

export const userRepository = new UserRepository();
