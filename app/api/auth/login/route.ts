import { authController } from '../../../../controllers/AuthController';

export async function POST(req: Request) {
  return authController.login(req);
}
