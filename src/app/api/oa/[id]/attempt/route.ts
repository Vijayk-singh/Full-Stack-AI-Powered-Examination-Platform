import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import OAssessment from '../../../../../models/OAssessment';
import DSAQuestion from '../../../../../models/DSAQuestion';
import Question from '../../../../../models/Question';
import { verifyAuth } from '../../../../../utils/auth';
import { logApiActivity } from '../../../../../utils/logger';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await logApiActivity(req);
    const user = verifyAuth(req);
    await connectToDatabase();
    
    const resolvedParams = await params;
    const assessment = await OAssessment.findById(resolvedParams.id)
      .populate('mcqQuestions')
      .populate('dsaQuestions');

    if (!assessment) throw new Error('Assessment not found');

    // We must ensure the user has access. They can access if:
    // 1. Their email is in invitedStudents
    // 2. They have an active subscription that includes one of the allowedPlans
    
    // For simplicity, let's just allow if they are in invitedStudents or if they are admin/teacher.
    const isInvited = assessment.invitedStudents.includes(user.email);
    const isPrivileged = user.role === 'TEACHER' || user.role === 'ADMIN';

    if (!isInvited && !isPrivileged) {
      // In a real app we'd also check their subscription plan here via user.subscription
      throw new Error('You are not authorized to attempt this assessment');
    }

    // Hide test cases output/input if it's a student
    if (!isPrivileged) {
      if (assessment.dsaQuestions) {
        assessment.dsaQuestions.forEach((q: any) => {
          if (q.testCases) {
            q.testCases = q.testCases.map((tc: any) => {
              if (tc.isHidden) {
                return { isHidden: true }; // Hide the input/output for hidden test cases
              }
              return tc;
            });
          }
        });
      }
      
      if (assessment.mcqQuestions) {
        assessment.mcqQuestions.forEach((q: any) => {
          q.correctOption = undefined;
          q.explanation = undefined;
        });
      }
    }

    return NextResponse.json({ success: true, data: assessment });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
