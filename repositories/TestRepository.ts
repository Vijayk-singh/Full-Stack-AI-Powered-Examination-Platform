import Test, { ITest } from '../models/Test';
import { connectToDatabase } from '../lib/db';

export class TestRepository {
  async connect() {
    await connectToDatabase();
  }

  async findById(id: string, populateQuestions = false): Promise<ITest | null> {
    await this.connect();
    let query = Test.findById(id).populate('subjectId');
    if (populateQuestions) {
      query = query.populate({
        path: 'questions',
        populate: [{ path: 'subjectId' }, { path: 'topicId' }]
      });
    }
    return query;
  }

  async create(testData: Partial<ITest>): Promise<ITest> {
    await this.connect();
    const test = new Test(testData);
    return test.save();
  }

  async update(id: string, testData: Partial<ITest>): Promise<ITest | null> {
    await this.connect();
    return Test.findByIdAndUpdate(id, testData, { new: true });
  }

  async delete(id: string): Promise<ITest | null> {
    await this.connect();
    return Test.findByIdAndDelete(id);
  }

  async list(filter: any = {}, limit = 50, skip = 0): Promise<ITest[]> {
    await this.connect();
    return Test.find(filter)
      .populate('subjectId')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
  }

  async count(filter: any = {}): Promise<number> {
    await this.connect();
    return Test.countDocuments(filter);
  }
}

export const testRepository = new TestRepository();
