import { attemptRepository } from '../repositories/AttemptRepository';
import { testRepository } from '../repositories/TestRepository';
import { questionRepository } from '../repositories/QuestionRepository';
import { aiService } from './AIService';
import { IAttempt } from '../models/Attempt';
import { IQuestion } from '../models/Question';
import mongoose from 'mongoose';

export class AttemptService {
  async startAttempt(studentId: string, testId: string): Promise<IAttempt> {
    const test = await testRepository.findById(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    if (test.status !== 'PUBLISHED') {
      throw new Error('This test is not available for attempts');
    }

    // Check for existing incomplete attempt to resume
    const AttemptModel = mongoose.models.Attempt || mongoose.model('Attempt');
    const existingIncomplete = await AttemptModel.findOne({
      studentId: new mongoose.Types.ObjectId(studentId),
      testId: new mongoose.Types.ObjectId(testId),
      isCompleted: false,
    });
    if (existingIncomplete) {
      return existingIncomplete;
    }

    // Check attempts limit
    if (test.attemptsAllowed > 0) {
      const attemptsCount = await attemptRepository.countAttempts(studentId, testId);
      if (attemptsCount >= test.attemptsAllowed) {
        throw new Error(`You have reached the maximum number of attempts (${test.attemptsAllowed}) allowed for this test.`);
      }
    }

    // Create an empty, in-progress attempt
    return attemptRepository.create({
      studentId: new mongoose.Types.ObjectId(studentId) as any,
      testId: new mongoose.Types.ObjectId(testId) as any,
      answers: [],
      score: 0,
      accuracy: 0,
      completionTime: 0,
      isCompleted: false,
    });
  }

  evaluateAnswer(question: IQuestion, studentAnswer: any): { isCorrect: boolean; marks: number } {
    let isCorrect = false;
    let marks = 0;

    const correct = question.correctAnswer;

    switch (question.type) {
      case 'MCQ': {
        // studentAnswer should be option index (number or string representation)
        isCorrect = String(studentAnswer) === String(correct);
        break;
      }
      case 'TRUE_FALSE': {
        isCorrect = String(studentAnswer).toLowerCase() === String(correct).toLowerCase();
        break;
      }
      case 'MULTIPLE_CORRECT': {
        // studentAnswer should be an array of indexes, e.g. [0, 2]
        if (Array.isArray(studentAnswer) && Array.isArray(correct)) {
          const sortedStudent = [...studentAnswer].map(String).sort();
          const sortedCorrect = [...correct].map(String).sort();
          isCorrect = sortedStudent.length === sortedCorrect.length &&
                      sortedStudent.every((val, index) => val === sortedCorrect[index]);
        }
        break;
      }
      case 'NUMERICAL': {
        // Compare values numerically
        const studentNum = parseFloat(studentAnswer);
        const correctNum = parseFloat(correct);
        if (!isNaN(studentNum) && !isNaN(correctNum)) {
          isCorrect = Math.abs(studentNum - correctNum) < 0.0001; // Allow float rounding margin
        } else {
          isCorrect = String(studentAnswer).trim() === String(correct).trim();
        }
        break;
      }
      case 'SUBJECTIVE': {
        // Subjective answers are default graded by AI in services/AIService or left for manual review
        // In our automatic evaluator, we mark it as pending, but give it 0 marks until graded.
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      marks = question.marks || 1;
    } else {
      marks = -(question.negativeMarks || 0);
    }

    return { isCorrect, marks };
  }

  async submitAttempt(
    attemptId: string,
    submittedAnswers: { questionId: string; answer: any }[],
    completionTime: number // in seconds
  ): Promise<IAttempt> {
    const attempt = await attemptRepository.findById(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    if (attempt.isCompleted) {
      throw new Error('This attempt has already been submitted');
    }

        const testIdStr = (attempt.testId as any)._id?.toString() || attempt.testId.toString();
    const test = await testRepository.findById(testIdStr, true);
    if (!test) {
      throw new Error('Associated test not found');
    }

    const questions: IQuestion[] = test.questions as any;
    const gradedAnswers = [];
    let totalScore = 0;
    let correctCount = 0;
    let attemptedCount = 0;

    for (const question of questions) {
      const qIdStr = question._id.toString();
      const submitted = submittedAnswers.find((sa) => sa.questionId === qIdStr);

      if (submitted && submitted.answer !== undefined && submitted.answer !== null && submitted.answer !== '') {
        attemptedCount++;
        const { isCorrect, marks } = this.evaluateAnswer(question, submitted.answer);
        
        // Let's grade subjective answers using AI if needed. We will trigger subjective grading inside the AI service.
        if (question.type === 'SUBJECTIVE') {
          // Keep as pending or grade instantly if we have a fast path. We will handle AI Report generation which will analyze it.
        }

        if (isCorrect) correctCount++;

        totalScore += marks;
        gradedAnswers.push({
          questionId: question._id,
          answer: submitted.answer,
          isCorrect,
          marksObtained: marks,
          feedback: question.explanation || '',
        });
      } else {
        // Unanswered
        gradedAnswers.push({
          questionId: question._id,
          answer: null,
          isCorrect: false,
          marksObtained: 0,
          feedback: 'Unanswered. ' + (question.explanation || ''),
        });
      }
    }

    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    // Floor score at 0 or allow negative? Standard examination platforms allow negative scores. We'll allow it.
    attempt.answers = gradedAnswers as any;
    attempt.score = totalScore;
    attempt.accuracy = accuracy;
    attempt.completionTime = completionTime;
    attempt.isCompleted = true;

    const savedAttempt = await attempt.save();

    // Trigger AI Student Analysis report generation asynchronously
    // In a real app we'd push to a queue, here we start it in background.
    aiService.generateStudentReport(savedAttempt._id.toString()).catch((err) => {
      console.error('Failed to generate AI performance report in background:', err);
    });

    return savedAttempt;
  }

  async getAttemptDetails(attemptId: string) {
    return attemptRepository.findById(attemptId);
  }

  async getStudentStats(studentId: string) {
    return attemptRepository.getStudentStats(studentId);
  }

  async getRecentAttempts(studentId: string, limit = 5) {
    return attemptRepository.getRecentAttempts(studentId, limit);
  }

  async getLeaderboard(testId: string) {
    return attemptRepository.getLeaderboard(testId);
  }
}

export const attemptService = new AttemptService();
