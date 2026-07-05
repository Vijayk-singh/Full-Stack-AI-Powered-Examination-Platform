import UserSubscription, { IUserSubscription } from '../models/UserSubscription';
import { connectToDatabase } from '../lib/db';
import '../models/User';
import '../models/SubscriptionPlan';

export class UserSubscriptionRepository {
  async connect() {
    await connectToDatabase();
  }

  async findActiveByUserId(userId: string): Promise<IUserSubscription | null> {
    await this.connect();
    return UserSubscription.findOne({
      userId,
      status: 'ACTIVE',
      endDate: { $gt: new Date() }
    }).populate('planId');
  }

  async create(userSubData: Partial<IUserSubscription>): Promise<IUserSubscription> {
    await this.connect();
    const userSub = new UserSubscription(userSubData);
    return userSub.save();
  }

  async update(id: string, userSubData: Partial<IUserSubscription>): Promise<IUserSubscription | null> {
    await this.connect();
    return UserSubscription.findByIdAndUpdate(id, userSubData, { new: true }).populate('planId');
  }

  async findById(id: string): Promise<IUserSubscription | null> {
    await this.connect();
    return UserSubscription.findById(id).populate('planId');
  }

  async list(filter: any = {}, limit = 50, skip = 0): Promise<IUserSubscription[]> {
    await this.connect();
    return UserSubscription.find(filter)
      .populate('userId', 'name email')
      .populate('planId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
  }

  async count(filter: any = {}): Promise<number> {
    await this.connect();
    return UserSubscription.countDocuments(filter);
  }
}

export const userSubscriptionRepository = new UserSubscriptionRepository();
