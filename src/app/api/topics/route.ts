import { logApiActivity } from '../../../utils/logger';
import { topicRepository } from '../../../repositories/TopicRepository';
import { successResponse, handleRouteError } from '../../../utils/response';

export async function GET(req: Request) {
  await logApiActivity(req);
  try {
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');
    const filter = subjectId ? { subjectId } : {};
    const topics = await topicRepository.list(filter);
    return successResponse(topics);
  } catch (error) {
    return handleRouteError(error);
  }
}
