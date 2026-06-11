import { subscriptionController } from '../../../../controllers/SubscriptionController';

export async function GET(req: Request) {
  return subscriptionController.listPlans(req);
}

export async function POST(req: Request) {
  return subscriptionController.createPlan(req);
}
