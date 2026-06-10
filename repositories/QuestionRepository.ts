import Question, { IQuestion } from '../models/Question';
import { connectToDatabase } from '../lib/db';

export class QuestionRepository {
  async connect() {
    await connectToDatabase();
  }

  async findById(id: string): Promise<IQuestion | null> {
    await this.connect();
    return Question.findById(id).populate('subjectId').populate('topicId');
  }

  async create(questionData: Partial<IQuestion>): Promise<IQuestion> {
    await this.connect();
    const question = new Question(questionData);
    return question.save();
  }

  async update(id: string, questionData: Partial<IQuestion>): Promise<IQuestion | null> {
    await this.connect();
    return Question.findByIdAndUpdate(id, questionData, { new: true });
  }

  async delete(id: string): Promise<IQuestion | null> {
    await this.connect();
    return Question.findByIdAndDelete(id);
  }

  async list(filter: any = {}, limit = 50, skip = 0): Promise<IQuestion[]> {
    await this.connect();
    return Question.find(filter)
      .populate('subjectId')
      .populate('topicId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
  }

  async count(filter: any = {}): Promise<number> {
    await this.connect();
    return Question.countDocuments(filter);
  }

  async findManyByIds(ids: string[]): Promise<IQuestion[]> {
    await this.connect();
    return Question.find({ _id: { $in: ids } });
  }

  async getRandomQuestions(
    subjectId: string,
    topicId?: string,
    difficulty?: string,
    limit = 10
  ): Promise<IQuestion[]> {
    await this.connect();
    const match: any = { subjectId };
    if (topicId) match.topicId = topicId;
    if (difficulty) match.difficulty = difficulty;

    return Question.aggregate([
      { $match: match },
      { $sample: { size: limit } }
    ]);
  }
}

export const questionRepository = new QuestionRepository();
