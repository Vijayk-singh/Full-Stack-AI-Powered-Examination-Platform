import { logApiActivity } from '../../../utils/logger';
import { testController } from '../../../controllers/TestController';

export async function GET(req: Request) {
  await logApiActivity(req);
  return testController.list(req);
}

export async function POST(req: Request) {
  await logApiActivity(req);
  return testController.create(req);
}
