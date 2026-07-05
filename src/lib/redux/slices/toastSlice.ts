import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
}

const initialState: ToastState = {
  toasts: [],
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<{ id: string; message: string; type: ToastType }>) => {
      state.toasts.push(action.payload);
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
  },
});

export const { addToast, removeToast } = toastSlice.actions;

export const showToast = (message: string, type: ToastType = 'info', duration = 4000) => (dispatch: any) => {
  const id = Math.random().toString(36).substring(2, 9);
  dispatch(addToast({ id, message, type }));
  if (duration > 0) {
    setTimeout(() => {
      dispatch(removeToast(id));
    }, duration);
  }
};

export default toastSlice.reducer;
