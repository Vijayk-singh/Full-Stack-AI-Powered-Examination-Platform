import mongoose from 'mongoose';
import ActivityLog from '../models/ActivityLog';
import { connectToDatabase } from '../lib/db';
import { authService } from '../services/AuthService';

export async function logApiActivity(req: Request) {
  try {
    await connectToDatabase();
    
    const url = new URL(req.url);
    const endpoint = url.pathname;
    const method = req.method;
    
    // Skip logging for the logs endpoint itself to prevent infinite loop
    if (endpoint.startsWith('/api/admin/logs')) return;

    let userId = undefined;
    let role = undefined;
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = authService.verifyAccessToken(token);
        if (payload) {
          userId = new mongoose.Types.ObjectId(payload.userId);
          role = payload.role;
        }
      } catch (e) {
        // invalid token, ignore
      }
    }

    const action = `${method} ${endpoint}`;

    await ActivityLog.create({
      userId,
      role,
      action,
      endpoint,
      method,
      ipAddress: req.headers.get('x-forwarded-for') || 'Unknown',
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
