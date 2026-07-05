import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ user: User | null; token: string | null }>) => {
      const { user, token } = action.payload;
      state.user = user;
      state.accessToken = token;
      
      if (typeof window !== 'undefined') {
        if (user && token) {
          localStorage.setItem('auth_user', JSON.stringify(user));
          localStorage.setItem('auth_token', token);
        } else {
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_token');
        }
      }
    },
    logoutAction: (state) => {
      state.user = null;
      state.accessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }
    },
    hydrateAuth: (state) => {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('auth_user');
        const storedToken = localStorage.getItem('auth_token');
        if (storedUser && storedToken) {
          state.user = JSON.parse(storedUser);
          state.accessToken = storedToken;
        }
      }
    },
  },
});

export const { setAuth, logoutAction, hydrateAuth } = authSlice.actions;

// Async thunk alternative or just a helper function since redux thunks require extra setup,
// but for simplicity we can export a helper to handle the fetch call, or just handle fetch directly in the component.
// I will keep the fetch call in the component or a dedicated async action if needed.
export const logout = () => async (dispatch: any) => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    console.error('Logout API failure:', e);
  }
  dispatch(logoutAction());
};

export default authSlice.reducer;
