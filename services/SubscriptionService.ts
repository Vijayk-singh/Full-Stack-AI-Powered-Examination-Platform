import { subscriptionPlanRepository } from '../repositories/SubscriptionPlanRepository';
import { userSubscriptionRepository } from '../repositories/UserSubscriptionRepository';
import { attemptRepository } from '../repositories/AttemptRepository';
import { ISubscriptionPlan } from '../models/SubscriptionPlan';
import { IUserSubscription } from '../models/UserSubscription';
import mongoose from 'mongoose';

export class SubscriptionService {
  async createPlan(planData: Partial<ISubscriptionPlan>): Promise<ISubscriptionPlan> {
    if (!planData.name || planData.price === undefined) {
      throw new Error('Plan name and price are required');
    }
    return subscriptionPlanRepository.create(planData);
  }

  async updatePlan(id: string, planData: Partial<ISubscriptionPlan>): Promise<ISubscriptionPlan | null> {
    return subscriptionPlanRepository.update(id, planData);
  }

  async getPlan(id: string): Promise<ISubscriptionPlan | null> {
    return subscriptionPlanRepository.findById(id);
  }

  async listPlans(filter: any = {}, limit = 50, skip = 0): Promise<{ plans: ISubscriptionPlan[]; total: number }> {
    const plans = await subscriptionPlanRepository.list(filter, limit, skip);
    const total = await subscriptionPlanRepository.count(filter);
    return { plans, total };
  }

  async deletePlan(id: string): Promise<ISubscriptionPlan | null> {
    return subscriptionPlanRepository.delete(id);
  }

  async getActiveSubscription(userId: string): Promise<IUserSubscription | null> {
    return userSubscriptionRepository.findActiveByUserId(userId);
  }

  async subscribeUser(userId: string, planId: string): Promise<IUserSubscription> {
    const plan = await subscriptionPlanRepository.findById(planId);
    if (!plan) {
      throw new Error('Subscription plan not found');
    }
    if (!plan.isActive) {
      throw new Error('This subscription plan is currently inactive');
    }

    // Deactivate any existing active subscriptions for this user
    await this.connect(); // ensure DB is connected
    const UserSubscriptionModel = mongoose.models.UserSubscription || mongoose.model('UserSubscription');
    await UserSubscriptionModel.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), status: 'ACTIVE' },
      { $set: { status: 'CANCELLED' } }
    );

    // Calculate end date
    const startDate = new Date();
    let endDate: Date;

    if (plan.expiryDate) {
      endDate = new Date(plan.expiryDate);
    } else if (plan.durationDays) {
      endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    } else {
      endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // default 30 days
    }

    return userSubscriptionRepository.create({
      userId: new mongoose.Types.ObjectId(userId) as any,
      planId: new mongoose.Types.ObjectId(planId) as any,
      startDate,
      endDate,
      status: 'ACTIVE',
    });
  }

  async checkUserAccessToTest(userId: string, testId: string): Promise<{ hasAccess: boolean; reason?: string }> {
    const activeSub = await userSubscriptionRepository.findActiveByUserId(userId);
    if (!activeSub) {
      return {
        hasAccess: false,
        reason: 'You do not have an active subscription. Please subscribe to a plan to attempt tests.'
      };
    }

    const plan = activeSub.planId as any; // Cast as plan model populated
    if (!plan) {
      return {
        hasAccess: false,
        reason: 'Internal Error: Subscription plan details missing.'
      };
    }

    // Check if this test is included in the plan's available tests
    const testList = plan.availableTests || [];
    const isIncluded = testList.some((tId: any) => tId.toString() === testId.toString());
    if (!isIncluded) {
      return {
        hasAccess: false,
        reason: `This test is not included in your current subscription plan "${plan.name}".`
      };
    }

    // Check attempts for this test since subscription start date
    const AttemptModel = mongoose.models.Attempt || mongoose.model('Attempt');
    const attemptsCount = await AttemptModel.countDocuments({
      studentId: new mongoose.Types.ObjectId(userId),
      testId: new mongoose.Types.ObjectId(testId),
      createdAt: { $gte: activeSub.startDate }
    });

    if (plan.attemptsPerTest > 0 && attemptsCount >= plan.attemptsPerTest) {
      return {
        hasAccess: false,
        reason: `You have reached the maximum number of attempts (${plan.attemptsPerTest}) allowed for this test under your subscription plan "${plan.name}".`
      };
    }

    return { hasAccess: true };
  }

  private async connect() {
    const { connectToDatabase } = require('../lib/db');
    await connectToDatabase();
  }
}

export const subscriptionService = new SubscriptionService();
