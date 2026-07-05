import { questionRepository } from '../repositories/QuestionRepository';
import { subjectRepository } from '../repositories/SubjectRepository';
import { topicRepository } from '../repositories/TopicRepository';
import { IQuestion } from '../models/Question';

export class QuestionService {
  async getOrCreateSubjectAndTopic(subjectName: string, topicName: string) {
    let subject = await subjectRepository.findByName(subjectName);
    if (!subject) {
      subject = await subjectRepository.create(subjectName, `${subjectName} subject automatically created`);
    }

    let topic = await topicRepository.findByNameAndSubject(subject._id.toString(), topicName);
    if (!topic) {
      topic = await topicRepository.create(subject._id.toString(), topicName);
    }

    return { subject, topic };
  }

  async createQuestion(questionData: Partial<IQuestion> & { subjectName?: string; topicName?: string }): Promise<IQuestion> {
    if (questionData.subjectName && questionData.topicName) {
      const { subject, topic } = await this.getOrCreateSubjectAndTopic(questionData.subjectName, questionData.topicName);
      questionData.subjectId = subject._id as any;
      questionData.topicId = topic._id as any;
    }

    if (!questionData.questionText || !questionData.subjectId || !questionData.topicId || !questionData.createdBy) {
      throw new Error('Missing required fields: questionText, subjectId, topicId, createdBy');
    }

    return questionRepository.create(questionData);
  }

  async updateQuestion(id: string, questionData: Partial<IQuestion>): Promise<IQuestion | null> {
    return questionRepository.update(id, questionData);
  }

  async deleteQuestion(id: string): Promise<IQuestion | null> {
    return questionRepository.delete(id);
  }

  async getQuestion(id: string): Promise<IQuestion | null> {
    return questionRepository.findById(id);
  }

  async listQuestions(filter: any = {}, limit = 50, skip = 0): Promise<{ questions: IQuestion[]; total: number }> {
    const questions = await questionRepository.list(filter, limit, skip);
    const total = await questionRepository.count(filter);
    return { questions, total };
  }
}

export const questionService = new QuestionService();
