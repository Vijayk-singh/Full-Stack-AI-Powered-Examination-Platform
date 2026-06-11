import AIReport, { IAIReport } from '../models/AIReport';
import { connectToDatabase } from '../lib/db';
import '../models/User';
import '../models/Test';

export class AIReportRepository {
  async connect() {
    await connectToDatabase();
  }

  async findById(id: string): Promise<IAIReport | null> {
    await this.connect();
    return AIReport.findById(id)
      .populate('studentId', 'name email')
      .populate('testId', 'title description');
  }

  async findByAttemptId(attemptId: string): Promise<IAIReport | null> {
    await this.connect();
    return AIReport.findOne({ attemptId })
      .populate('studentId', 'name email')
      .populate('testId', 'title description');
  }

  async findByStudentAndTest(studentId: string, testId: string): Promise<IAIReport | null> {
    await this.connect();
    return AIReport.findOne({ studentId, testId }).sort({ createdAt: -1 });
  }

  async create(reportData: Partial<IAIReport>): Promise<IAIReport> {
    await this.connect();
    const report = new AIReport(reportData);
    return report.save();
  }

  async listByStudent(studentId: string, limit = 10): Promise<IAIReport[]> {
    await this.connect();
    return AIReport.find({ studentId })
      .populate('testId', 'title')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export const aiReportRepository = new AIReportRepository();
