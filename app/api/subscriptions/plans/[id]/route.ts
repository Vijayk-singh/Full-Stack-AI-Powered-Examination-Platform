import { subscriptionController } from '../../../../../controllers/SubscriptionController';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return subscriptionController.getPlanDetails(req, resolvedParams.id);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return subscriptionController.updatePlan(req, resolvedParams.id);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return subscriptionController.deletePlan(req, resolvedParams.id);
}
