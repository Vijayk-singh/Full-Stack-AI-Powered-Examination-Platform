import { logApiActivity } from '../../../utils/logger';
import { subjectRepository } from '../../../repositories/SubjectRepository';
import { successResponse, handleRouteError } from '../../../utils/response';

export async function GET(req: Request) {
  await logApiActivity(req);
  try {
    const subjects = await subjectRepository.list({});
    return successResponse(subjects);
  } catch (error) {
    return handleRouteError(error);
  }
}
