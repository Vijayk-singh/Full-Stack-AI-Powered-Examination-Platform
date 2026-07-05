import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import ActivityLog from '../../../../models/ActivityLog';
import { verifyAuth } from '../../../../utils/auth';

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req, ['ADMIN']);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ActivityLog.countDocuments();

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          limit,
          page,
          pages: Math.ceil(total / limit),
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 401 });
  }
}
