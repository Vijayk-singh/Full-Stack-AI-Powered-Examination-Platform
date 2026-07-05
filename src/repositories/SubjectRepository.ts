import Subject, { ISubject } from '../models/Subject';
import { connectToDatabase } from '../lib/db';

export class SubjectRepository {
  async connect() {
    await connectToDatabase();
  }

  async findById(id: string): Promise<ISubject | null> {
    await this.connect();
    return Subject.findById(id);
  }

  async findByName(name: string): Promise<ISubject | null> {
    await this.connect();
    return Subject.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  }

  async create(name: string, description?: string): Promise<ISubject> {
    await this.connect();
    const subject = new Subject({ name, description });
    return subject.save();
  }

  async list(filter = {}): Promise<ISubject[]> {
    await this.connect();
    return Subject.find(filter).sort({ name: 1 });
  }

  async update(id: string, updateData: Partial<ISubject>): Promise<ISubject | null> {
    await this.connect();
    return Subject.findByIdAndUpdate(id, updateData, { new: true });
  }

  async delete(id: string): Promise<ISubject | null> {
    await this.connect();
    return Subject.findByIdAndDelete(id);
  }
}

export const subjectRepository = new SubjectRepository();
