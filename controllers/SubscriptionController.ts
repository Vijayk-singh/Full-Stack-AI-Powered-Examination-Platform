import { subscriptionService } from '../services/SubscriptionService';
import { verifyAuth } from '../utils/auth';
import { successResponse, handleRouteError, errorResponse } from '../utils/response';
import { userSubscriptionRepository } from '../repositories/UserSubscriptionRepository';

export class SubscriptionController {
  // Admin: Create subscription plan
  async createPlan(req: Request) {
    try {
      verifyAuth(req, ['ADMIN']);
      const body = await req.json();
      
      if (!body.name || body.price === undefined || body.attemptsPerTest === undefined) {
        return errorResponse('Plan name, price, and attemptsPerTest are required', 400);
      }

      const plan = await subscriptionService.createPlan(body);
      return successResponse(plan, 'Subscription plan created successfully', 201);
    } catch (error) {
      return handleRouteError(error);
    }
  }

  // Admin/Teacher: Update subscription plan
  async updatePlan(req: Request, id: string) {
    try {
      verifyAuth(req, ['ADMIN', 'TEACHER']);
      const body = await req.json();
      const updated = await subscriptionService.updatePlan(id, body);
      if (!updated) {
        return errorResponse('Subscription plan not found', 404);
      }
      return successResponse(updated, 'Subscription plan updated successfully');
    } catch (error) {
      return handleRouteError(error);
    }
  }

  // Admin: Delete subscription plan
  async deletePlan(req: Request, id: string) {
    try {
      verifyAuth(req, ['ADMIN']);
      const deleted = await subscriptionService.deletePlan(id);
      if (!deleted) {
        return errorResponse('Subscription plan not found', 404);
      }
      return successResponse(null, 'Subscription plan deleted successfully');
    } catch (error) {
      return handleRouteError(error);
    }
  }

  // General: List plans (Students see active plans, Admins see all)
  async listPlans(req: Request) {
    try {
      const user = verifyAuth(req);
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const page = parseInt(searchParams.get('page') || '1');
      const skip = (page - 1) * limit;

      const filter: any = {};
      // Students should only see active subscription plans
      if (user.role === 'STUDENT') {
        filter.isActive = true;
      } else {
        const activeOnly = searchParams.get('activeOnly');
        if (activeOnly === 'true') {
          filter.isActive = true;
        }
      }

      const result = await subscriptionService.listPlans(filter, limit, skip);
      return successResponse({
        plans: result.plans,
        pagination: {
          total: result.total,
          limit,
          page,
          pages: Math.ceil(result.total / limit),
        }
      });
    } catch (error) {
      return handleRouteError(error);
    }
  }

  // General: Get single plan details
  async getPlanDetails(req: Request, id: string) {
    try {
      verifyAuth(req);
      const plan = await subscriptionService.getPlan(id);
      if (!plan) {
        return errorResponse('Subscription plan not found', 404);
      }
      return successResponse(plan);
    } catch (error) {
      return handleRouteError(error);
    }
  }

  // Student: Subscribe to a plan (free / bypass payment for now)
  async subscribe(req: Request) {
    try {
      const user = verifyAuth(req, ['STUDENT']);
      const body = await req.json();
      
      if (!body.planId) {
        return errorResponse('Plan ID is required', 400);
      }

      const subscription = await subscriptionService.subscribeUser(user.userId, body.planId);
      return successResponse(subscription, 'Subscribed successfully', 201);
    } catch (error) {
      return handleRouteError(error);
    }
  }

  // Student: Get current active subscription
  async getActiveSubscription(req: Request) {
    try {
      const user = verifyAuth(req);
      const subscription = await subscriptionService.getActiveSubscription(user.userId);
      return successResponse(subscription || null);
    } catch (error) {
      return handleRouteError(error);
    }
  }

  // Admin: List all student subscriptions
  async listAllSubscriptions(req: Request) {
    try {
      verifyAuth(req, ['ADMIN']);
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50');
      const page = parseInt(searchParams.get('page') || '1');
      const skip = (page - 1) * limit;

      const filter: any = {};
      const status = searchParams.get('status');
      if (status) {
        filter.status = status.toUpperCase();
      }

      const subscriptions = await userSubscriptionRepository.list(filter, limit, skip);
      const total = await userSubscriptionRepository.count(filter);

      return successResponse({
        subscriptions,
        pagination: {
          total,
          limit,
          page,
          pages: Math.ceil(total / limit),
        }
      });
    } catch (error) {
      return handleRouteError(error);
    }
  }
}

export const subscriptionController = new SubscriptionController();
