import { questionController } from '../../../controllers/QuestionController';

export async function GET(req: Request) {
  return questionController.list(req);
}

export async function POST(req: Request) {
  return questionController.create(req);
}
