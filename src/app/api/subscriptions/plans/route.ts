import { logApiActivity } from '../../../../utils/logger';
import { subscriptionController } from '../../../../controllers/SubscriptionController';

export async function GET(req: Request) {
  await logApiActivity(req);
  return subscriptionController.listPlans(req);
}

export async function POST(req: Request) {
  await logApiActivity(req);
  return subscriptionController.createPlan(req);
}
