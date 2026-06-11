import { authController } from '../../../../controllers/AuthController';

export async function GET(req: Request) {
  return authController.getProfile(req);
}

export async function PUT(req: Request) {
  return authController.updateProfile(req);
}
