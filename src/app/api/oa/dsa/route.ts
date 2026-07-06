import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import DSAQuestion from '../../../../models/DSAQuestion';
import { verifyAuth } from '../../../../utils/auth';
import { logApiActivity } from '../../../../utils/logger';

export async function POST(req: Request) {
  try {
    await logApiActivity(req);
    const user = verifyAuth(req, ['TEACHER', 'ADMIN']);
    await connectToDatabase();
    
    const body = await req.json();
    const newQuestion = new DSAQuestion({
      ...body,
      createdBy: user.userId
    });
    
    await newQuestion.save();
    return NextResponse.json({ success: true, data: newQuestion });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    await logApiActivity(req);
    verifyAuth(req); // Any authenticated user can view? No, mostly teachers list them.
    await connectToDatabase();
    
    const questions = await DSAQuestion.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: questions });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
