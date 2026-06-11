import SubscriptionPlan, { ISubscriptionPlan } from '../models/SubscriptionPlan';
import { connectToDatabase } from '../lib/db';
import '../models/Test';

export class SubscriptionPlanRepository {
  async connect() {
    await connectToDatabase();
  }

  async findById(id: string): Promise<ISubscriptionPlan | null> {
    await this.connect();
    return SubscriptionPlan.findById(id).populate('availableTests');
  }

  async create(planData: Partial<ISubscriptionPlan>): Promise<ISubscriptionPlan> {
    await this.connect();
    const plan = new SubscriptionPlan(planData);
    return plan.save();
  }

  async update(id: string, planData: Partial<ISubscriptionPlan>): Promise<ISubscriptionPlan | null> {
    await this.connect();
    return SubscriptionPlan.findByIdAndUpdate(id, planData, { new: true }).populate('availableTests');
  }

  async delete(id: string): Promise<ISubscriptionPlan | null> {
    await this.connect();
    return SubscriptionPlan.findByIdAndDelete(id);
  }

  async list(filter: any = {}, limit = 50, skip = 0): Promise<ISubscriptionPlan[]> {
    await this.connect();
    return SubscriptionPlan.find(filter)
      .populate('availableTests')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
  }

  async count(filter: any = {}): Promise<number> {
    await this.connect();
    return SubscriptionPlan.countDocuments(filter);
  }
}

export const subscriptionPlanRepository = new SubscriptionPlanRepository();
