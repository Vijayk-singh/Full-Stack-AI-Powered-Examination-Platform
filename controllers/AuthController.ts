import { authService } from '../services/AuthService';
import { validateRegister, validateLogin } from '../validators';
import { successResponse, handleRouteError, errorResponse } from '../utils/response';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export class AuthController {
  async register(req: Request) {
    try {
      const body = await req.json();
      validateRegister(body);
      
      const user = await authService.registerUser(body);
      return successResponse(user, 'User registered successfully', 201);
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async login(req: Request) {
    try {
      const body = await req.json();
      validateLogin(body);

      const { user, accessToken, refreshToken } = await authService.loginUser(body.email, body.password);

      // Set Refresh Token as HTTP-Only cookie
      const response = successResponse({ user, accessToken }, 'Login successful');
      
      // Mapped to next/headers cookies
      const cookieStore = await cookies();
      cookieStore.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      return response;
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async refresh(req: Request) {
    try {
      const cookieStore = await cookies();
      const refreshToken = cookieStore.get('refreshToken')?.value;

      if (!refreshToken) {
        return errorResponse('Refresh token not found', 401);
      }

      const { accessToken } = await authService.refreshAccessToken(refreshToken);
      return successResponse({ accessToken }, 'Token refreshed successfully');
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async logout() {
    try {
      const cookieStore = await cookies();
      cookieStore.delete('refreshToken');
      return successResponse(null, 'Logged out successfully');
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async forgotPassword(req: Request) {
    try {
      const body = await req.json();
      if (!body.email) {
        return errorResponse('Email is required', 400);
      }
      const result = await authService.forgotPassword(body.email);
      return successResponse(null, result.message);
    } catch (error) {
      return handleRouteError(error);
    }
  }

  async resetPassword(req: Request) {
    try {
      const body = await req.json();
      if (!body.userId || !body.password) {
        return errorResponse('User ID and new password are required', 400);
      }
      await authService.resetPassword(body.userId, body.password);
      return successResponse(null, 'Password has been reset successfully');
    } catch (error) {
      return handleRouteError(error);
    }
  }
}

export const authController = new AuthController();
