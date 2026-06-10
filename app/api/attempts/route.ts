import { attemptController } from '../../../controllers/AttemptController';

export async function GET(req: Request) {
  return attemptController.listStudentAttempts(req);
}

export async function POST(req: Request) {
  return attemptController.start(req);
}
