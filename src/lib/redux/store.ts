import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import examReducer from './slices/examSlice';
import toastReducer from './slices/toastSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    exam: examReducer,
    toast: toastReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
