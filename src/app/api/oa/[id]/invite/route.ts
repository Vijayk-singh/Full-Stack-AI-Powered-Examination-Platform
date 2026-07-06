import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import OAssessment from '../../../../../models/OAssessment';
import { verifyAuth } from '../../../../../utils/auth';
import { logApiActivity } from '../../../../../utils/logger';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await logApiActivity(req);
    verifyAuth(req, ['TEACHER', 'ADMIN']);
    await connectToDatabase();
    
    const resolvedParams = await params;
    const body = await req.json();
    const { emails } = body; // Array of emails

    if (!emails || !Array.isArray(emails)) {
      throw new Error('Please provide an array of emails');
    }

    const assessment = await OAssessment.findById(resolvedParams.id);
    if (!assessment) throw new Error('Assessment not found');

    // Add unique emails
    const currentEmails = new Set(assessment.invitedStudents || []);
    emails.forEach(email => currentEmails.add(email));
    
    assessment.invitedStudents = Array.from(currentEmails);
    await assessment.save();

    return NextResponse.json({ success: true, message: `Successfully invited ${emails.length} students.`, data: assessment.invitedStudents });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
