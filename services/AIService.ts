import { questionRepository } from '../repositories/QuestionRepository';
import { attemptRepository } from '../repositories/AttemptRepository';
import { aiReportRepository } from '../repositories/AIReportRepository';
import { testRepository } from '../repositories/TestRepository';
import { connectToDatabase } from '../lib/db';
import { PDFParse } from 'pdf-parse';

export class AIService {
  private getApiKey(): { type: 'gemini' | 'openai' | 'none'; key: string } {
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here') {
      return { type: 'gemini', key: process.env.GEMINI_API_KEY };
    }
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
      return { type: 'openai', key: process.env.OPENAI_API_KEY };
    }
    return { type: 'none', key: '' };
  }

  private async callAI(prompt: string, jsonMode = false): Promise<string> {
    const api = this.getApiKey();

    if (api.type === 'gemini') {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${api.key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: jsonMode ? { responseMimeType: 'application/json' } : {},
            }),
          }
        );
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (err) {
        console.error('Gemini API request failed, falling back to mock:', err);
      }
    } else if (api.type === 'openai') {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${api.key}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: jsonMode ? { type: 'json_object' } : undefined,
          }),
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      } catch (err) {
        console.error('OpenAI API request failed, falling back to mock:', err);
      }
    }

    return '';
  }

  /**
   * Generates mock questions when AI is offline/no API key.
   */
  private getMockQuestions(subject: string, topic: string, difficulty: string, count: number): any[] {
    const list = [];
    for (let i = 1; i <= count; i++) {
      list.push({
        questionText: `Sample question ${i} on ${topic} (${difficulty} difficulty)`,
        type: 'MCQ',
        options: [
          `Option A: Core detail about ${topic}`,
          `Option B: Incorrect statement about ${topic}`,
          `Option C: Plausible but incorrect fact`,
          `Option D: Extraneous choice`,
        ],
        correctAnswer: 0, // Option A
        explanation: `This is a sample explanation for question ${i} regarding ${topic}. The correct response is Option A because it represents the fundamental theorem of ${subject}.`,
        difficulty: difficulty.toUpperCase(),
        marks: 4,
        negativeMarks: 1,
        tags: [subject, topic, 'AI-Generated'],
      });
    }
    return list;
  }

  /**
   * AI-generated test questions creator.
   */
  async generateTestQuestions(
    subjectName: string,
    topicName: string,
    difficulty: string,
    count: number
  ): Promise<any[]> {
    const api = this.getApiKey();

    if (api.type === 'none') {
      return this.getMockQuestions(subjectName, topicName, difficulty, count);
    }

    const prompt = `
      You are an expert examiner. Generate ${count} high-quality, exam-grade multiple choice questions (MCQ) on the subject "${subjectName}" and topic "${topicName}" with difficulty level "${difficulty}".
      Return the output strictly as a JSON object matching this TypeScript structure:
      {
        "questions": Array<{
          "questionText": string,
          "type": "MCQ",
          "options": string[], // Exactly 4 options
          "correctAnswer": number, // Index of the correct option (0-3)
          "explanation": string, // Comprehensive justification of correct answer
          "difficulty": "EASY" | "MEDIUM" | "HARD",
          "marks": number, // Standard mark e.g., 2 or 4
          "negativeMarks": number // E.g., 0.5 or 1
          "tags": string[]
        }>
      }
      Do not output any markdown formatting (like \`\`\`json) outside of the raw JSON. Just return the JSON object.
    `;

    const responseText = await this.callAI(prompt, true);
    if (!responseText) {
      return this.getMockQuestions(subjectName, topicName, difficulty, count);
    }

    try {
      // Clean JSON formatting markdown wrapper if present
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return parsed.questions || this.getMockQuestions(subjectName, topicName, difficulty, count);
    } catch (err) {
      console.error('Failed to parse AI response, falling back to mock:', err);
      return this.getMockQuestions(subjectName, topicName, difficulty, count);
    }
  }

  /**
   * PDF parsing and question extraction.
   */
  async parsePdfAndExtractQuestions(fileBuffer: Buffer): Promise<{
    metadata: { numPages: number; title?: string };
    questions: any[];
  }> {
    let pdfText = '';
    let numPages = 1;
    try {
      const parser = new PDFParse({ data: fileBuffer });
      const data = await parser.getText();
      pdfText = data.text;
      numPages = data.total;
    } catch (err) {
      console.error('Error parsing PDF file:', err);
      throw new Error('Failed to read PDF file format');
    }

    const api = this.getApiKey();
    if (api.type === 'none') {
      // Return dummy mock questions extracted
      return {
        metadata: { numPages, title: 'Uploaded PYQ Document' },
        questions: this.getMockQuestions('General Studies', 'PDF Extraction', 'MEDIUM', 3),
      };
    }

    // Truncate text if too large (e.g. limit to first 12000 chars to avoid token limits)
    const truncatedText = pdfText.substring(0, 15000);

    const prompt = `
      You are an OCR and Document Parsing assistant. Analyze this extracted text from an examination PDF and parse it into structured question objects.
      Extracted Text:
      "${truncatedText}"

      Return the response strictly in JSON format structure:
      {
        "questions": Array<{
          "questionText": string,
          "type": "MCQ" | "MULTIPLE_CORRECT" | "TRUE_FALSE" | "NUMERICAL" | "SUBJECTIVE",
          "options": string[], // Empty array if Numerical or Subjective
          "correctAnswer": any, // number index (0-indexed) for MCQ, array of numbers for MULTIPLE_CORRECT, "true"/"false" for TRUE_FALSE, number or text for NUMERICAL
          "explanation": string,
          "difficulty": "EASY" | "MEDIUM" | "HARD",
          "subject": string, // Guess the subject category
          "topic": string, // Guess the specific topic
          "marks": number,
          "negativeMarks": number,
          "tags": string[]
        }>
      }
      Extract up to 8 distinct questions found in the text. Ensure valid JSON without extra text tags.
    `;

    const responseText = await this.callAI(prompt, true);
    if (!responseText) {
      return {
        metadata: { numPages, title: 'Uploaded PDF Document' },
        questions: this.getMockQuestions('General Studies', 'PDF Extraction Fallback', 'MEDIUM', 3),
      };
    }

    try {
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        metadata: { numPages, title: 'Parsed PYQ Document' },
        questions: parsed.questions || [],
      };
    } catch (err) {
      console.error('Failed to parse AI PDF questions:', err);
      return {
        metadata: { numPages, title: 'Uploaded PDF Document' },
        questions: this.getMockQuestions('General Studies', 'PDF Parsing Error Fallback', 'MEDIUM', 2),
      };
    }
  }

  /**
   * PDF PYQ analysis.
   */
  async analyzePYQWeightage(fileBuffer: Buffer): Promise<any> {
    let pdfText = '';
    try {
      const parser = new PDFParse({ data: fileBuffer });
      const data = await parser.getText();
      pdfText = data.text;
    } catch (err) {
      console.error('Error parsing PDF for PYQ Analysis:', err);
      pdfText = 'Mock PYQ data for history paper';
    }

    const api = this.getApiKey();
    if (api.type === 'none') {
      return {
        repeatedTopics: ['Database Normalization', 'SQL Queries', 'CPU Scheduling', 'Virtual Memory'],
        importantChapters: ['Operating Systems', 'Relational Databases', 'Computer Networks'],
        weightageAnalysis: [
          { chapter: 'Operating Systems', weightage: 35 },
          { chapter: 'Database Management Systems', weightage: 30 },
          { chapter: 'Computer Networks', weightage: 20 },
          { chapter: 'Algorithms & Data Structures', weightage: 15 }
        ],
        difficultyDistribution: { EASY: 40, MEDIUM: 40, HARD: 20 },
        probableQuestions: [
          'Explain the difference between optimistic concurrency control and pessimistic locking.',
          'Define the Bankers Algorithm and explain how deadlock is prevented.',
          'Calculate the TCP throughput given round trip time (RTT) and packet loss rate.'
        ]
      };
    }

    const truncatedText = pdfText.substring(0, 15000);
    const prompt = `
      Analyze this extracted text from past year question papers (PYQs). Identify repeating themes, chapter weightages, difficulty distribution, and forecast potential future examination questions.
      Extracted Text:
      "${truncatedText}"

      Return a strict JSON object with this format:
      {
        "repeatedTopics": string[],
        "importantChapters": string[],
        "weightageAnalysis": Array<{ "chapter": string, "weightage": number }>, // values out of 100
        "difficultyDistribution": { "EASY": number, "MEDIUM": number, "HARD": number }, // percentages summing to 100
        "probableQuestions": string[] // 3 to 5 predicted questions
      }
    `;

    const responseText = await this.callAI(prompt, true);
    try {
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      console.error('Failed to parse PYQ weightage JSON:', err);
      return {
        repeatedTopics: ['Error in AI Parsing'],
        importantChapters: ['Standard Syllabus'],
        weightageAnalysis: [],
        difficultyDistribution: { EASY: 50, MEDIUM: 30, HARD: 20 },
        probableQuestions: []
      };
    }
  }

  /**
   * Generates AI performance analytics and recommendations after test completion.
   */
  async generateStudentReport(attemptId: string): Promise<any> {
    await connectToDatabase();
    const attempt = await attemptRepository.findById(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    const test = await testRepository.findById(attempt.testId.toString(), true);
    if (!test) {
      throw new Error('Test not found');
    }

    // 1. Compute basic statistics
    const questions: any[] = test.questions;
    const subjectStats: any = {};
    const topicStats: any = {};
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Analyze question by question
    for (const ans of attempt.answers) {
      const matchingQ = questions.find((q) => q._id.toString() === ans.questionId.toString());
      if (matchingQ) {
        const subName = matchingQ.subjectId?.name || 'General';
        const topName = matchingQ.topicId?.name || 'General Topic';

        // Subject aggregation
        if (!subjectStats[subName]) {
          subjectStats[subName] = { total: 0, correct: 0, score: 0 };
        }
        subjectStats[subName].total++;
        if (ans.isCorrect) {
          subjectStats[subName].correct++;
          subjectStats[subName].score += matchingQ.marks || 1;
        } else {
          subjectStats[subName].score -= matchingQ.negativeMarks || 0;
        }

        // Topic aggregation
        if (!topicStats[topName]) {
          topicStats[topName] = { total: 0, correct: 0, accuracy: 0 };
        }
        topicStats[topName].total++;
        if (ans.isCorrect) {
          topicStats[topName].correct++;
        }
      }
    }

    // Compute accuracies and categorize strengths/weaknesses
    for (const topName of Object.keys(topicStats)) {
      const stat = topicStats[topName];
      stat.accuracy = Math.round((stat.correct / stat.total) * 100);
      if (stat.accuracy >= 70) {
        strengths.push(topName);
      } else if (stat.accuracy < 50) {
        weaknesses.push(topName);
      }
    }

    // If strengths or weaknesses are empty, put defaults
    if (strengths.length === 0) strengths.push('General Concepts');
    if (weaknesses.length === 0) weaknesses.push('Advanced Topics');

    // 2. Generate Recommendations and revision plan via AI if key exists, otherwise use template
    const api = this.getApiKey();
    let speedAccuracyAnalysis = `You solved the exam in ${Math.round(attempt.completionTime / 60)} minutes and ${attempt.completionTime % 60} seconds. Your average speed was ${Math.round((attempt.completionTime / (attempt.answers.length || 1)) * 10) / 10} seconds per question.`;
    let suggestedRevisionPlan = `## Recommended Revision Plan\n\n1. **Review Mistakes**: Spend 30 minutes reading explanations for incorrect questions in **${weaknesses.join(', ')}**.\n2. **Practice More**: Take topic-specific quizzes in subjects with accuracy below 60%.\n3. **Time Management**: Your speed is decent, but keep practices under timed conditions to improve speed-accuracy balance.`;

    if (api.type !== 'none') {
      const summaryText = `
        Student name: ${(attempt.studentId as any)?.name || 'Student'}
        Exam: ${test.title}
        Total questions: ${attempt.answers.length}
        Score obtained: ${attempt.score} out of ${test.totalMarks}
        Overall Accuracy: ${attempt.accuracy}%
        Time taken: ${attempt.completionTime} seconds (limit was ${test.duration * 60} seconds)
        Correct answers: ${attempt.answers.filter((a) => a.isCorrect).length}
        Strong topics: ${strengths.join(', ')}
        Weak topics: ${weaknesses.join(', ')}
      `;

      const prompt = `
        You are an academic coach and AI counselor. Provide a student performance report and improvement advice based on this exam summary:
        ${summaryText}

        Generate a strict JSON object with this structure:
        {
          "speedAccuracyAnalysis": "Detailed paragraph analyzing their solving speed versus accuracy.",
          "recommendations": {
            "suggestedTests": string[], // 2 suggested topic quizzes or test types
            "suggestedTopics": string[], // 2-3 topics needing quick review
            "suggestedRevisionPlan": "Markdown-formatted step-by-step revision calendar and tips"
          }
        }
      `;

      const responseText = await this.callAI(prompt, true);
      try {
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.speedAccuracyAnalysis) speedAccuracyAnalysis = parsed.speedAccuracyAnalysis;
        if (parsed.recommendations) {
          return aiReportRepository.create({
            studentId: attempt.studentId as any,
            testId: attempt.testId as any,
            attemptId: attempt._id as any,
            strengths,
            weaknesses,
            speedAccuracyAnalysis,
            subjectAnalysis: subjectStats,
            topicAnalysis: topicStats,
            recommendations: parsed.recommendations,
          });
        }
      } catch (err) {
        console.error('Failed to parse AI Student Report response, using fallback details:', err);
      }
    }

    // Fallback report save
    return aiReportRepository.create({
      studentId: attempt.studentId as any,
      testId: attempt.testId as any,
      attemptId: attempt._id as any,
      strengths,
      weaknesses,
      speedAccuracyAnalysis,
      subjectAnalysis: subjectStats,
      topicAnalysis: topicStats,
      recommendations: {
        suggestedTests: [`Practice Test: ${test.title} Review`, `${(test.subjectId as any)?.name || 'General'} Intermediate Mock`],
        suggestedTopics: weaknesses,
        suggestedRevisionPlan,
      },
    });
  }
}

export const aiService = new AIService();
