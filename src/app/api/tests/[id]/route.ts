import { logApiActivity } from '../../../../utils/logger';
import { testController } from '../../../../controllers/TestController';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await logApiActivity(req);
  const resolvedParams = await params;
  return testController.get(req, resolvedParams.id);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await logApiActivity(req);
  const resolvedParams = await params;
  return testController.update(req, resolvedParams.id);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await logApiActivity(req);
  const resolvedParams = await params;
  return testController.delete(req, resolvedParams.id);
}
