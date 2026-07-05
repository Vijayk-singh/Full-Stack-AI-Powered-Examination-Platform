import { logApiActivity } from '../../../utils/logger';
import { attemptController } from '../../../controllers/AttemptController';

export async function GET(req: Request) {
  await logApiActivity(req);
  return attemptController.listStudentAttempts(req);
}

export async function POST(req: Request) {
  await logApiActivity(req);
  return attemptController.start(req);
}
