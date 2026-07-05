import { logApiActivity } from '../../../utils/logger';
import { subscriptionController } from '../../../controllers/SubscriptionController';

export async function GET(req: Request) {
  await logApiActivity(req);
  return subscriptionController.listAllSubscriptions(req);
}
