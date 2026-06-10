import { aiController } from '../../../../controllers/AIController';

export async function POST(req: Request) {
  return aiController.analyzePYQ(req);
}
