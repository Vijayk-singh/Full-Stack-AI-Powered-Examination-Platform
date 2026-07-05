import { attemptService } from '../services/AttemptService';
import { aiReportRepository } from '../repositories/AIReportRepository';
import { verifyAuth } from '../utils/auth';
import { successResponse, handleRouteError, errorResponse } from '../utils/response';

export class AttemptController {
  async start(req: Request) {
    try {
      const user = verifyAuth(req, ['STUDENT']);
      const body = await req.json();
      if (!body.testId) {
        return errorResponse('Test ID is required', 400);
      }

      const attempt = await attemptService.startAttempt(user.userId, body.testId);
      return successResponse(attempt, 'Attempt started successfully', 201);
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async submit(req: Request, id: string) {
    try {
      const user = verifyAuth(req, ['STUDENT']);
      const existing = await attemptService.getAttemptDetails(id);
      if (!existing) return errorResponse('Attempt not found', 404);
      if (existing.studentId._id.toString() !== user.userId) {
        return errorResponse('Forbidden: You can only submit your own attempt', 403);
      }
      
      const body = await req.json();
      if (!body.answers || body.completionTime === undefined) {
        return errorResponse('Answers array and completionTime are required', 400);
      }

      const attempt = await attemptService.submitAttempt(id, body.answers, body.completionTime);
      return successResponse(attempt, 'Attempt submitted and graded successfully');
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async getDetails(req: Request, id: string) {
    try {
      const user = verifyAuth(req);
      const attempt = await attemptService.getAttemptDetails(id);
      if (!attempt) {
        return errorResponse('Attempt not found', 404);
      }

      // Safeguard: Students can only view their own attempts, Teachers/Admins can view any
      if (user.role === 'STUDENT' && attempt.studentId._id.toString() !== user.userId) {
        return errorResponse('Forbidden: You can only view your own attempts', 403);
      }

      return successResponse(attempt);
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async listStudentAttempts(req: Request) {
    try {
      const user = verifyAuth(req);
      const { searchParams } = new URL(req.url);

      // Students can only list their own. Admin/Teachers can filter by studentId query param
      let studentId = user.userId;
      if (user.role !== 'STUDENT') {
        const queryStudentId = searchParams.get('studentId');
        if (queryStudentId) studentId = queryStudentId;
      }

      const limit = parseInt(searchParams.get('limit') || '10');
      const attempts = await attemptService.getRecentAttempts(studentId, limit);
      const stats = await attemptService.getStudentStats(studentId);

      return successResponse({ attempts, stats });
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async getLeaderboard(req: Request, testId: string) {
    try {
      verifyAuth(req);
      if (!testId) {
        return errorResponse('Test ID is required', 400);
      }
      const leaderboard = await attemptService.getLeaderboard(testId);
      return successResponse(leaderboard);
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async getAnalysis(req: Request, attemptId: string) {
    try {
      const user = verifyAuth(req);
      const report = await aiReportRepository.findByAttemptId(attemptId);
      if (!report) {
        return errorResponse('AI analysis report not found for this attempt', 404);
      }

      if (user.role === 'STUDENT' && report.studentId._id.toString() !== user.userId) {
        return errorResponse('Forbidden: You can only view your own reports', 403);
      }

      return successResponse(report);
    } catch (error) {
      return handleRouteError(error);
    }
  }
}

export const attemptController = new AttemptController();
