import { subjectRepository } from '../../../repositories/SubjectRepository';
import { successResponse, handleRouteError } from '../../../utils/response';

export async function GET() {
  try {
    const subjects = await subjectRepository.list({});
    return successResponse(subjects);
  } catch (error) {
    return handleRouteError(error);
  }
}
