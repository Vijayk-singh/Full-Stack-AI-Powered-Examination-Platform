import { aiService } from '../services/AIService';
import { verifyAuth } from '../utils/auth';
import { successResponse, handleRouteError, errorResponse } from '../utils/response';

export class AIController {
  async generateTest(req: Request) {
    try {
      verifyAuth(req, ['TEACHER', 'ADMIN']);
      const body = await req.json();

      const { subject, topic, difficulty, count } = body;
      if (!subject || !topic) {
        return errorResponse('Subject and Topic are required', 400);
      }

      const questionCount = parseInt(count || '5');
      const difficultyLevel = difficulty || 'MEDIUM';

      const questions = await aiService.generateTestQuestions(
        subject,
        topic,
        difficultyLevel,
        questionCount
      );

      return successResponse(questions, 'AI questions generated successfully');
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async analyzePdf(req: Request) {
    try {
      verifyAuth(req, ['TEACHER', 'ADMIN']);
      
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return errorResponse('No PDF file uploaded', 400);
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await aiService.parsePdfAndExtractQuestions(buffer);
      return successResponse(result, 'PDF parsed and questions extracted successfully');
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async analyzePYQ(req: Request) {
    try {
      verifyAuth(req, ['TEACHER', 'ADMIN']);

      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return errorResponse('No PDF file uploaded', 400);
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const analysis = await aiService.analyzePYQWeightage(buffer);
      return successResponse(analysis, 'PYQ weightage analysis completed successfully');
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async generateReport(req: Request) {
    try {
      const user = verifyAuth(req);
      const body = await req.json();

      if (!body.attemptId) {
        return errorResponse('Attempt ID is required', 400);
      }

      const report = await aiService.generateStudentReport(body.attemptId);
      return successResponse(report, 'AI Performance report generated successfully');
    } catch (error) {
      return handleRouteError(error);
    }
  }
}

export const aiController = new AIController();
