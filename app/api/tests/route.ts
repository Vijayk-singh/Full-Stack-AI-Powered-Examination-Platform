import { testController } from '../../../controllers/TestController';

export async function GET(req: Request) {
  return testController.list(req);
}

export async function POST(req: Request) {
  return testController.create(req);
}
