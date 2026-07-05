import { logApiActivity } from '../../../utils/logger';
import { questionController } from '../../../controllers/QuestionController';

export async function GET(req: Request) {
  await logApiActivity(req);
  return questionController.list(req);
}

export async function POST(req: Request) {
  await logApiActivity(req);
  return questionController.create(req);
}
