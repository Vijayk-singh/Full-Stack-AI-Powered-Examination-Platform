import { logApiActivity } from '../../../../utils/logger';
import { authController } from '../../../../controllers/AuthController';

export async function GET(req: Request) {
  await logApiActivity(req);
  return authController.getProfile(req);
}

export async function PUT(req: Request) {
  await logApiActivity(req);
  return authController.updateProfile(req);
}
