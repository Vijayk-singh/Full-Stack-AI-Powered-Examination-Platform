export class ValidationError extends Error {
  errors: Record<string, string>;
  constructor(errors: Record<string, string>) {
    super('Validation Error');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export function validateRegister(body: any) {
  const errors: Record<string, string> = {};
  if (!body.name || body.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!body.email || !emailRegex.test(body.email)) {
    errors.email = 'Please enter a valid email address';
  }
  if (!body.password || body.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }
  if (body.role && !['STUDENT', 'TEACHER', 'ADMIN'].includes(body.role)) {
    errors.role = 'Role must be STUDENT, TEACHER, or ADMIN';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }
}

export function validateLogin(body: any) {
  const errors: Record<string, string> = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!body.email || !emailRegex.test(body.email)) {
    errors.email = 'Please enter a valid email address';
  }
  if (!body.password) {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }
}

export function validateQuestion(body: any) {
  const errors: Record<string, string> = {};
  if (!body.questionText || body.questionText.trim().length < 5) {
    errors.questionText = 'Question text must be at least 5 characters long';
  }
  if (body.type && !['MCQ', 'MULTIPLE_CORRECT', 'TRUE_FALSE', 'NUMERICAL', 'SUBJECTIVE'].includes(body.type)) {
    errors.type = 'Invalid question type';
  }
  if (!body.subjectId && !body.subjectName) {
    errors.subjectId = 'Subject is required';
  }
  if (!body.topicId && !body.topicName) {
    errors.topicId = 'Topic is required';
  }
  if (body.marks === undefined || isNaN(Number(body.marks)) || Number(body.marks) <= 0) {
    errors.marks = 'Marks must be a positive number';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }
}

export function validateTest(body: any) {
  const errors: Record<string, string> = {};
  if (!body.title || body.title.trim().length < 1) {
    errors.title = 'Title must not be empty';
  }
  if (!body.subjectId) {
    errors.subjectId = 'Subject is required';
  }
  if (body.duration === undefined || isNaN(Number(body.duration)) || Number(body.duration) <= 0) {
    errors.duration = 'Duration must be a positive number';
  }
  if (body.testType && !['PRACTICE', 'SCHEDULED', 'INSTANT'].includes(body.testType)) {
    errors.testType = 'Invalid test type';
  }
  if (body.testType === 'SCHEDULED') {
    if (!body.startDate) {
      errors.startDate = 'Start date is required for scheduled tests';
    }
    if (!body.endDate) {
      errors.endDate = 'End date is required for scheduled tests';
    }
    if (body.startDate && body.endDate && new Date(body.startDate) >= new Date(body.endDate)) {
      errors.endDate = 'End date must be after start date';
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }
}
