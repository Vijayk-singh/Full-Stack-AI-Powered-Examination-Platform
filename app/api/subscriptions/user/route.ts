import { subscriptionController } from '../../../../controllers/SubscriptionController';

export async function GET(req: Request) {
  return subscriptionController.getActiveSubscription(req);
}

export async function POST(req: Request) {
  return subscriptionController.subscribe(req);
}
