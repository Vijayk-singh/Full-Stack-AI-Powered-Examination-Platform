import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
}

const initialState: ExamState = {
  activeAttemptId: null,
  testId: null,
  testTitle: null,
  questions: [],
  answers: [],
  duration: 0,
  timeLeft: 0,
  tabSwitches: 0,
  isExamActive: false,
};

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    startExam: (state, action: PayloadAction<{ attemptId: string; testId: string; title: string; questions: any[]; duration: number }>) => {
      const { attemptId, testId, title, questions, duration } = action.payload;
      state.activeAttemptId = attemptId;
      state.testId = testId;
      state.testTitle = title;
      state.questions = questions;
      state.answers = questions.map((q) => ({ questionId: q._id, answer: null }));
      state.duration = duration;
      state.timeLeft = duration * 60;
      state.tabSwitches = 0;
      state.isExamActive = true;
    },
    updateAnswer: (state, action: PayloadAction<{ questionId: string; answer: any }>) => {
      const { questionId, answer } = action.payload;
      const existingIdx = state.answers.findIndex((item) => item.questionId === questionId);
      if (existingIdx !== -1) {
        state.answers[existingIdx] = { questionId, answer };
      } else {
        state.answers.push({ questionId, answer });
      }
    },
    tickTime: (state) => {
      if (state.timeLeft <= 1) {
        state.timeLeft = 0;
        state.isExamActive = false;
      } else {
        state.timeLeft -= 1;
      }
    },
    incrementTabSwitches: (state) => {
      state.tabSwitches += 1;
    },
    finishExam: (state) => {
      state.activeAttemptId = null;
      state.testId = null;
      state.testTitle = null;
      state.questions = [];
      state.answers = [];
      state.duration = 0;
      state.timeLeft = 0;
      state.tabSwitches = 0;
      state.isExamActive = false;
    },
  },
});

export const { startExam, updateAnswer, tickTime, incrementTabSwitches, finishExam } = examSlice.actions;
export default examSlice.reducer;
