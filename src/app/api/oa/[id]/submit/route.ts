import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import OAssessmentAttempt from '../../../../../models/OAssessmentAttempt';
import { verifyAuth } from '../../../../../utils/auth';
import { logApiActivity } from '../../../../../utils/logger';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await logApiActivity(req);
    const user = verifyAuth(req, ['STUDENT', 'TEACHER', 'ADMIN']);
    await connectToDatabase();
    
    const resolvedParams = await params;
    const body = await req.json();
    
    // In a real application, you would re-verify MCQ correct options on backend and execute DSA submissions against hidden test cases.
    // For this demonstration, we are accepting the calculated payload from the frontend (which executes code via the piston API).
    
    const attempt = new OAssessmentAttempt({
      assessmentId: resolvedParams.id,
      studentId: user.userId,
      status: 'SUBMITTED',
      mcqAnswers: body.mcqAnswers,
      dsaSubmissions: body.dsaSubmissions,
      totalScore: body.totalScore,
      completedAt: new Date()
    });

    await attempt.save();

    return NextResponse.json({ success: true, data: attempt });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
