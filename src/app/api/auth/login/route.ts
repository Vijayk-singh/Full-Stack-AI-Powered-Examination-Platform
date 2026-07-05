import { logApiActivity } from '../../../../utils/logger';
import { authController } from '../../../../controllers/AuthController';

export async function POST(req: Request) {
  await logApiActivity(req);
  return authController.login(req);
}
