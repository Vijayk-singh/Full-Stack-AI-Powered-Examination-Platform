import { create } from 'zustand';

export interface AnswerItem {
  questionId: string;
  answer: any;
}

interface ExamState {
  activeAttemptId: string | null;
  testId: string | null;
  testTitle: string | null;
  questions: any[];
  answers: AnswerItem[];
  duration: number; // in minutes
  timeLeft: number; // in seconds
  tabSwitches: number;
  isExamActive: boolean;
  
  startExam: (attemptId: string, testId: string, title: string, questions: any[], duration: number) => void;
  updateAnswer: (questionId: string, answer: any) => void;
  tickTime: () => void;
  incrementTabSwitches: () => void;
  finishExam: () => void;
}

export const useExamStore = create<ExamState>((set) => ({
  activeAttemptId: null,
  testId: null,
  testTitle: null,
  questions: [],
  answers: [],
  duration: 0,
  timeLeft: 0,
  tabSwitches: 0,
  isExamActive: false,

  startExam: (attemptId, testId, title, questions, duration) => {
    set({
      activeAttemptId: attemptId,
      testId,
      testTitle: title,
      questions,
      answers: questions.map((q) => ({ questionId: q._id, answer: null })),
      duration,
      timeLeft: duration * 60,
      tabSwitches: 0,
      isExamActive: true,
    });
  },

  updateAnswer: (questionId, answer) => {
    set((state) => {
      const existingIdx = state.answers.findIndex((item) => item.questionId === questionId);
      const newAnswers = [...state.answers];
      if (existingIdx !== -1) {
        newAnswers[existingIdx] = { questionId, answer };
      } else {
        newAnswers.push({ questionId, answer });
      }
      return { answers: newAnswers };
    });
  },

  tickTime: () => {
    set((state) => {
      if (state.timeLeft <= 1) {
        return { timeLeft: 0, isExamActive: false };
      }
      return { timeLeft: state.timeLeft - 1 };
    });
  },

  incrementTabSwitches: () => {
    set((state) => ({ tabSwitches: state.tabSwitches + 1 }));
  },

  finishExam: () => {
    set({
      activeAttemptId: null,
      testId: null,
      testTitle: null,
      questions: [],
      answers: [],
      duration: 0,
      timeLeft: 0,
      tabSwitches: 0,
      isExamActive: false,
    });
  },
}));
