import Topic, { ITopic } from '../models/Topic';
import { connectToDatabase } from '../lib/db';

export class TopicRepository {
  async connect() {
    await connectToDatabase();
  }

  async findById(id: string): Promise<ITopic | null> {
    await this.connect();
    return Topic.findById(id).populate('subjectId');
  }

  async findByNameAndSubject(subjectId: string, name: string): Promise<ITopic | null> {
    await this.connect();
    return Topic.findOne({ subjectId, name: { $regex: new RegExp(`^${name}$`, 'i') } });
  }

  async create(subjectId: string, name: string): Promise<ITopic> {
    await this.connect();
    const topic = new Topic({ subjectId, name });
    return topic.save();
  }

  async listBySubject(subjectId: string): Promise<ITopic[]> {
    await this.connect();
    return Topic.find({ subjectId }).sort({ name: 1 });
  }

  async list(filter = {}): Promise<ITopic[]> {
    await this.connect();
    return Topic.find(filter).populate('subjectId').sort({ name: 1 });
  }

  async delete(id: string): Promise<ITopic | null> {
    await this.connect();
    return Topic.findByIdAndDelete(id);
  }
}

export const topicRepository = new TopicRepository();
