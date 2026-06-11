import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/UserRepository';
import { IUser, UserRole } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-access-token-key-change-in-production-123456';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-token-key-change-in-production-789012';
const ACCESS_TOKEN_EXPIRY = '2h';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export class AuthService {
  async registerUser(userData: Partial<IUser>): Promise<Omit<IUser, 'password'>> {
    if (!userData.email || !userData.password || !userData.name) {
      throw new Error('Name, Email, and Password are required');
    }

    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email is already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUser = await userRepository.create({
      ...userData,
      password: hashedPassword,
      status: 'active', // by default active
    });

    const userObj = newUser.toObject();
    delete userObj.password;
    return userObj;
  }

  async loginUser(email: string, password?: string): Promise<{ user: Omit<IUser, 'password'>; accessToken: string; refreshToken: string }> {
    if (!email || !password) {
      throw new Error('Email and Password are required');
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new Error('Account is inactive or pending. Please contact support.');
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

    const userObj = user.toObject();
    delete userObj.password;

    return {
      user: userObj,
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(token: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
      const user = await userRepository.findById(decoded.userId);

      if (!user || user.status !== 'active') {
        throw new Error('User inactive or not found');
      }

      const payload: TokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
      return { accessToken };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Avoid enumerating users, but for our flow return a nice mocked response
      return { message: 'If the email exists, a password reset link has been sent.' };
    }

    // In a production app, we would save a verification token with expiry and send an email.
    // For now, log the action and return success.
    console.log(`Password reset link requested for: ${email}`);
    return { message: 'If the email exists, a password reset link has been sent.' };
  }

  async resetPassword(userId: string, newPassword?: string): Promise<{ success: boolean }> {
    if (!newPassword) {
      throw new Error('New password is required');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updatedUser = await userRepository.update(userId, { password: hashedPassword });
    if (!updatedUser) {
      throw new Error('User not found');
    }

    return { success: true };
  }

  async updateUserProfile(
    userId: string,
    updateData: { name?: string; email?: string; avatar?: string; password?: string }
  ): Promise<Omit<IUser, 'password'>> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updates: any = {};
    if (updateData.name !== undefined) updates.name = updateData.name;
    if (updateData.email !== undefined) {
      const existing = await userRepository.findByEmail(updateData.email);
      if (existing && existing._id.toString() !== userId) {
        throw new Error('Email is already registered by another account');
      }
      updates.email = updateData.email;
    }
    if (updateData.avatar !== undefined) updates.avatar = updateData.avatar;
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updateData.password, salt);
    }

    const updatedUser = await userRepository.update(userId, updates);
    if (!updatedUser) {
      throw new Error('Failed to update profile');
    }

    const userObj = updatedUser.toObject();
    delete userObj.password;
    return userObj;
  }
}

export const authService = new AuthService();
