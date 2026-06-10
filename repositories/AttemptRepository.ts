import Attempt, { IAttempt } from '../models/Attempt';
import { connectToDatabase } from '../lib/db';
import mongoose from 'mongoose';

export class AttemptRepository {
  async connect() {
    await connectToDatabase();
  }

  async findById(id: string): Promise<IAttempt | null> {
    await this.connect();
    return Attempt.findById(id)
      .populate('studentId', 'name email avatar')
      .populate({
        path: 'testId',
        populate: { path: 'subjectId' }
      });
  }

  async create(attemptData: Partial<IAttempt>): Promise<IAttempt> {
    await this.connect();
    const attempt = new Attempt(attemptData);
    return attempt.save();
  }

  async update(id: string, attemptData: Partial<IAttempt>): Promise<IAttempt | null> {
    await this.connect();
    return Attempt.findByIdAndUpdate(id, attemptData, { new: true });
  }

  async count(filter: any = {}): Promise<number> {
    await this.connect();
    return Attempt.countDocuments(filter);
  }

  async list(filter: any = {}, limit = 50, skip = 0): Promise<IAttempt[]> {
    await this.connect();
    return Attempt.find(filter)
      .populate('studentId', 'name email')
      .populate({
        path: 'testId',
        populate: { path: 'subjectId' }
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
  }

  async getRecentAttempts(studentId: string, limit = 5): Promise<IAttempt[]> {
    await this.connect();
    return Attempt.find({ studentId, isCompleted: true })
      .populate({
        path: 'testId',
        populate: { path: 'subjectId' }
      })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async countAttempts(studentId: string, testId: string): Promise<number> {
    await this.connect();
    return Attempt.countDocuments({ studentId, testId });
  }

  async getLeaderboard(testId: string): Promise<any[]> {
    await this.connect();
    return Attempt.find({ testId, isCompleted: true })
      .populate('studentId', 'name email avatar')
      .sort({ score: -1, completionTime: 1 })
      .limit(100);
  }

  async getStudentStats(studentId: string): Promise<{ avgScore: number; avgAccuracy: number; totalCompleted: number }> {
    await this.connect();
    const results = await Attempt.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId), isCompleted: true } },
      {
        $group: {
          _id: '$studentId',
          avgScore: { $avg: '$score' },
          avgAccuracy: { $avg: '$accuracy' },
          totalCompleted: { $sum: 1 }
        }
      }
    ]);

    if (results.length === 0) {
      return { avgScore: 0, avgAccuracy: 0, totalCompleted: 0 };
    }

    return {
      avgScore: Math.round(results[0].avgScore * 100) / 100,
      avgAccuracy: Math.round(results[0].avgAccuracy * 100) / 100,
      totalCompleted: results[0].totalCompleted
    };
  }
}

export const attemptRepository = new AttemptRepository();
