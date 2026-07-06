import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import OAssessment from '../../../models/OAssessment';
import { verifyAuth } from '../../../utils/auth';
import { logApiActivity } from '../../../utils/logger';

export async function POST(req: Request) {
  try {
    await logApiActivity(req);
    const user = verifyAuth(req, ['TEACHER', 'ADMIN']);
    await connectToDatabase();
    
    const body = await req.json();
    const newAssessment = new OAssessment({
      ...body,
      createdBy: user.userId
    });
    
    await newAssessment.save();
    return NextResponse.json({ success: true, data: newAssessment });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    await logApiActivity(req);
    const user = verifyAuth(req);
    await connectToDatabase();
    
    let query: any = {};
    if (user.role === 'STUDENT') {
      // Logic for student viewing OAs will go here, 
      // but typically students access via specific links or we fetch based on their plans.
      // For now, let's just return what they are invited to or allowed by plan.
      // We will implement this later in the specific route.
      query = {};
    }

    const assessments = await OAssessment.find(query)
      .populate('mcqQuestions')
      .populate('dsaQuestions')
      .populate('allowedPlans')
      .sort({ createdAt: -1 });
      
    return NextResponse.json({ success: true, data: assessments });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
