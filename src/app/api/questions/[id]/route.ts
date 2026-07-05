import { logApiActivity } from '../../../../utils/logger';
import { questionController } from '../../../../controllers/QuestionController';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await logApiActivity(req);
  const resolvedParams = await params;
  return questionController.get(req, resolvedParams.id);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await logApiActivity(req);
  const resolvedParams = await params;
  return questionController.update(req, resolvedParams.id);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await logApiActivity(req);
  const resolvedParams = await params;
  return questionController.delete(req, resolvedParams.id);
}
