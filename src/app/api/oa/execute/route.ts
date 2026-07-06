import { NextResponse } from 'next/server';
import { logApiActivity } from '../../../../utils/logger';

export async function POST(req: Request) {
  try {
    await logApiActivity(req);
    const { language, code, input } = await req.json();

    const versionMap: Record<string, string> = {
      'python': '3.10.0',
      'javascript': '18.15.0',
      'c++': '10.2.0',
      'java': '15.0.2'
    };

    const runLanguage = language === 'c++' ? 'cpp' : language;
    const version = versionMap[language] || '*';

    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        language: runLanguage,
        version: version,
        files: [
          {
            content: code
          }
        ],
        stdin: input || '',
        args: [],
        compile_timeout: 10000,
        run_timeout: 3000,
        compile_memory_limit: -1,
        run_memory_limit: -1
      })
    });

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
