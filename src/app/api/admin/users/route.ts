import { logApiActivity } from '../../../../utils/logger';
import { authController } from '../../../../controllers/AuthController';

export async function GET(req: Request) {
  await logApiActivity(req);
  return authController.listUsers(req);
}
