import { logApiActivity } from '../../../../../../utils/logger';
import { authController } from '../../../../../../controllers/AuthController';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await logApiActivity(req);
  const resolvedParams = await params;
  return authController.updateUserStatus(req, resolvedParams.id);
}
