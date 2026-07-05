import { testRepository } from '../repositories/TestRepository';
import { questionRepository } from '../repositories/QuestionRepository';
import { ITest } from '../models/Test';

export class TestService {
  async calculateTotalMarks(questionIds: string[]): Promise<number> {
    if (!questionIds || questionIds.length === 0) return 0;
    const questions = await questionRepository.findManyByIds(questionIds);
    return questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  }

  async createTest(testData: Partial<ITest>): Promise<ITest> {
    if (!testData.title || !testData.subjectId || !testData.createdBy) {
      throw new Error('Title, Subject, and Creator are required to create a test');
    }

    const questionIds = (testData.questions || []).map(id => id.toString());
    testData.totalMarks = await this.calculateTotalMarks(questionIds);

    return testRepository.create(testData);
  }

  async updateTest(id: string, testData: Partial<ITest>): Promise<ITest | null> {
    const existingTest = await testRepository.findById(id);
    if (!existingTest) {
      throw new Error('Test not found');
    }

    if (testData.questions) {
      const questionIds = testData.questions.map(id => id.toString());
      testData.totalMarks = await this.calculateTotalMarks(questionIds);
    }

    return testRepository.update(id, testData);
  }

  async getTest(id: string, populateQuestions = false): Promise<ITest | null> {
    return testRepository.findById(id, populateQuestions);
  }

  async listTests(filter: any = {}, limit = 50, skip = 0): Promise<{ tests: ITest[]; total: number }> {
    const tests = await testRepository.list(filter, limit, skip);
    const total = await testRepository.count(filter);
    return { tests, total };
  }

  async deleteTest(id: string): Promise<ITest | null> {
    return testRepository.delete(id);
  }

  async setTestStatus(id: string, status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED'): Promise<ITest | null> {
    return testRepository.update(id, { status });
  }
}

export const testService = new TestService();
