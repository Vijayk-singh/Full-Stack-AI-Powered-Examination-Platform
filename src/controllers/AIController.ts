import { aiService } from '../services/AIService';
import { verifyAuth } from '../utils/auth';
import { successResponse, handleRouteError, errorResponse } from '../utils/response';

// Simple in-memory rate limiting to prevent API exhaustion (Denial of Wallet)
const rateLimitCache = new Map<string, { count: number, resetTime: number }>();

function checkRateLimit(userId: string, limit: number, windowMs: number) {
  const now = Date.now();
  const userCache = rateLimitCache.get(userId);
  if (!userCache || now > userCache.resetTime) {
    rateLimitCache.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (userCache.count >= limit) {
    return false;
  }
  userCache.count++;
  return true;
}

export class AIController {
  async generateTest(req: Request) {
    try {
      const user = verifyAuth(req, ['TEACHER', 'ADMIN']);
      if (!checkRateLimit(user.userId, 10, 60 * 60 * 1000)) { // 10 per hour
        return errorResponse('Too many AI requests. Please try again later.', 429);
      }
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
      const user = verifyAuth(req, ['TEACHER', 'ADMIN']);
      if (!checkRateLimit(user.userId, 5, 60 * 60 * 1000)) { // 5 PDFs per hour
        return errorResponse('Too many PDF analysis requests. Please try again later.', 429);
      }
      
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
      const user = verifyAuth(req, ['TEACHER', 'ADMIN']);
      if (!checkRateLimit(user.userId, 5, 60 * 60 * 1000)) { // 5 PYQs per hour
        return errorResponse('Too many PYQ analysis requests. Please try again later.', 429);
      }

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
      if (!checkRateLimit(user.userId, 20, 60 * 60 * 1000)) { // 20 reports per hour
        return errorResponse('Too many AI report requests. Please try again later.', 429);
      }
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
