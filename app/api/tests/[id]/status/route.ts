import { testController } from '../../../../../controllers/TestController';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return testController.setStatus(req, resolvedParams.id);
}
