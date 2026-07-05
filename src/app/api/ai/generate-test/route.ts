import { logApiActivity } from '../../../../utils/logger';
import { aiController } from '../../../../controllers/AIController';

export async function POST(req: Request) {
  await logApiActivity(req);
  return aiController.generateTest(req);
}
