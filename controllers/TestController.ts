import { testService } from '../services/TestService';
import { verifyAuth } from '../utils/auth';
import { validateTest } from '../validators';
import { successResponse, handleRouteError, errorResponse } from '../utils/response';
import mongoose from 'mongoose';

export class TestController {
  async create(req: Request) {
    try {
      const user = verifyAuth(req, ['TEACHER', 'ADMIN']);
      const body = await req.json();
      validateTest(body);

      const test = await testService.createTest({
        ...body,
        createdBy: new mongoose.Types.ObjectId(user.userId) as any,
      });

      return successResponse(test, 'Test created successfully', 201);
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async get(req: Request, id: string) {
    try {
      const user = verifyAuth(req);
      const test = await testService.getTest(id, true);
      if (!test) {
        return errorResponse('Test not found', 404);
      }

      // Security: Strip correct answers and explanations for STUDENTS if attempting
      const testObj = test.toObject();
      if (user.role === 'STUDENT' && testObj.questions) {
        testObj.questions = testObj.questions.map((q: any) => {
          const { correctAnswer, explanation, ...publicFields } = q;
          return publicFields;
        });
      }

      return successResponse(testObj);
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async update(req: Request, id: string) {
    try {
      verifyAuth(req, ['TEACHER', 'ADMIN']);
      const body = await req.json();
      const updated = await testService.updateTest(id, body);
      if (!updated) {
        return errorResponse('Test not found', 404);
      }
      return successResponse(updated, 'Test updated successfully');
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async delete(req: Request, id: string) {
    try {
      verifyAuth(req, ['TEACHER', 'ADMIN']);
      const deleted = await testService.deleteTest(id);
      if (!deleted) {
        return errorResponse('Test not found', 404);
      }
      return successResponse(null, 'Test deleted successfully');
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async list(req: Request) {
    try {
      const user = verifyAuth(req);
      const { searchParams } = new URL(req.url);

      const subjectId = searchParams.get('subjectId');
      const testType = searchParams.get('testType');
      const limit = parseInt(searchParams.get('limit') || '20');
      const page = parseInt(searchParams.get('page') || '1');
      const skip = (page - 1) * limit;

      const filter: any = {};
      if (subjectId) filter.subjectId = subjectId;
      if (testType) filter.testType = testType.toUpperCase();

      // Students should only see published tests (or instant/practice)
      if (user.role === 'STUDENT') {
        filter.status = 'PUBLISHED';
        filter.isPublic = { $ne: false };
      } else {
        // Teachers / Admins can filter by status
        const status = searchParams.get('status');
        if (status) filter.status = status.toUpperCase();
      }

      const { tests, total } = await testService.listTests(filter, limit, skip);

      return successResponse({
        tests,
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

  async setStatus(req: Request, id: string) {
    try {
      verifyAuth(req, ['TEACHER', 'ADMIN']);
      const body = await req.json();
      if (!body.status || !['DRAFT', 'PUBLISHED', 'UNPUBLISHED'].includes(body.status)) {
        return errorResponse('Invalid status value', 400);
      }

      const updated = await testService.setTestStatus(id, body.status);
      if (!updated) {
        return errorResponse('Test not found', 404);
      }

      return successResponse(updated, `Test status updated to ${body.status}`);
    } catch (error) {
      return handleRouteError(error);
    }
  }
}

export const testController = new TestController();
