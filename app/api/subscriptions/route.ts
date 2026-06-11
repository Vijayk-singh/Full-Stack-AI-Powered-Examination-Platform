import { subscriptionController } from '../../../controllers/SubscriptionController';

export async function GET(req: Request) {
  return subscriptionController.listAllSubscriptions(req);
}
