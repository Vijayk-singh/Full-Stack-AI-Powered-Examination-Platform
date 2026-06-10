import { questionService } from '../services/QuestionService';
import { verifyAuth } from '../utils/auth';
import { validateQuestion } from '../validators';
import { successResponse, handleRouteError, errorResponse } from '../utils/response';
import mongoose from 'mongoose';

export class QuestionController {
  async create(req: Request) {
    try {
      const user = verifyAuth(req, ['TEACHER', 'ADMIN']);
      const body = await req.json();
      validateQuestion(body);

      const question = await questionService.createQuestion({
        ...body,
        createdBy: new mongoose.Types.ObjectId(user.userId) as any,
      });

      return successResponse(question, 'Question created successfully', 201);
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async get(req: Request, id: string) {
    try {
      verifyAuth(req); // Any authenticated user can view details
      const question = await questionService.getQuestion(id);
      if (!question) {
        return errorResponse('Question not found', 404);
      }
      return successResponse(question);
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async update(req: Request, id: string) {
    try {
      verifyAuth(req, ['TEACHER', 'ADMIN']);
      const body = await req.json();
      const updated = await questionService.updateQuestion(id, body);
      if (!updated) {
        return errorResponse('Question not found', 404);
      }
      return successResponse(updated, 'Question updated successfully');
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async delete(req: Request, id: string) {
    try {
      verifyAuth(req, ['TEACHER', 'ADMIN']);
      const deleted = await questionService.deleteQuestion(id);
      if (!deleted) {
        return errorResponse('Question not found', 404);
      }
      return successResponse(null, 'Question deleted successfully');
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async list(req: Request) {
    try {
      verifyAuth(req);
      const { searchParams } = new URL(req.url);
      
      const subjectId = searchParams.get('subjectId');
      const topicId = searchParams.get('topicId');
      const difficulty = searchParams.get('difficulty');
      const limit = parseInt(searchParams.get('limit') || '20');
      const page = parseInt(searchParams.get('page') || '1');
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (subjectId) filter.subjectId = subjectId;
      if (topicId) filter.topicId = topicId;
      if (difficulty) filter.difficulty = difficulty.toUpperCase();

      const { questions, total } = await questionService.listQuestions(filter, limit, skip);
      
      return successResponse({
        questions,
        pagination: {
          total,
          limit,
          page,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return handleRouteError(error);
    }
  }
}

export const questionController = new QuestionController();
