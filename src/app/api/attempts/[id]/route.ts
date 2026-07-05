import { logApiActivity } from '../../../../utils/logger';
import { attemptController } from '../../../../controllers/AttemptController';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await logApiActivity(req);
  const resolvedParams = await params;
  return attemptController.getDetails(req, resolvedParams.id);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await logApiActivity(req);
  const resolvedParams = await params;
  return attemptController.submit(req, resolvedParams.id);
}
