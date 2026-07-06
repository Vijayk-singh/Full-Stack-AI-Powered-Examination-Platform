import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import OAssessmentAttempt from '../../../../../models/OAssessmentAttempt';
import OAssessment from '../../../../../models/OAssessment';
import { verifyAuth } from '../../../../../utils/auth';
import { logApiActivity } from '../../../../../utils/logger';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await logApiActivity(req);
    const user = verifyAuth(req);
    await connectToDatabase();
    
    const resolvedParams = await params;
    
    // Check if user is student and if leaderboard is public
    if (user.role === 'STUDENT') {
      const assessment = await OAssessment.findById(resolvedParams.id);
      if (!assessment?.isLeaderboardPublic) {
        throw new Error('Leaderboard is not public for this assessment');
      }
    }

    const attempts = await OAssessmentAttempt.find({ assessmentId: resolvedParams.id })
      .populate('studentId', 'name email')
      .sort({ totalScore: -1, completedAt: 1 });

    return NextResponse.json({ success: true, data: attempts });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
