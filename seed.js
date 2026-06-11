const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Load env variables
const envPath = path.join(__dirname, '.env');
let mongodbUri = 'mongodb://localhost:27017/exam_platform';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/^MONGODB_URI=(.+)$/m);
  if (match) {
    mongodbUri = match[1].trim();
  }
}

console.log('Connecting to database...');

// Schema Declarations
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['STUDENT', 'TEACHER', 'ADMIN'], default: 'STUDENT' },
  status: { type: String, enum: ['active', 'pending', 'inactive'], default: 'active' }
}, { timestamps: true });

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' }
}, { timestamps: true });

const TopicSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  name: { type: String, required: true }
}, { timestamps: true });

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'TRUE_FALSE', 'MULTIPLE_CORRECT', 'NUMERICAL', 'SUBJECTIVE'], required: true },
  options: [String],
  correctAnswer: mongoose.Schema.Types.Mixed,
  explanation: String,
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 }
}, { timestamps: true });

const TestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  duration: { type: Number, required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  totalMarks: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'UNPUBLISHED'], default: 'DRAFT' },
  testType: { type: String, enum: ['PRACTICE', 'SCHEDULED', 'INSTANT'], default: 'PRACTICE' },
  attemptsAllowed: { type: Number, default: 5 },
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

const SubscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  availableTests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }],
  expiryDate: { type: Date },
  durationDays: { type: Number, default: 30 },
  attemptsPerTest: { type: Number, required: true, default: 1 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const UserSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'], default: 'ACTIVE' }
}, { timestamps: true });

const AttemptSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    answer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    marksObtained: { type: Number, default: 0 },
    feedback: { type: String, default: '' }
  }],
  score: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  completionTime: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

// Compile Models
const User = mongoose.model('User', UserSchema);
const Subject = mongoose.model('Subject', SubjectSchema);
const Topic = mongoose.model('Topic', TopicSchema);
const Question = mongoose.model('Question', QuestionSchema);
const Test = mongoose.model('Test', TestSchema);
const SubscriptionPlan = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
const UserSubscription = mongoose.model('UserSubscription', UserSubscriptionSchema);
const Attempt = mongoose.model('Attempt', AttemptSchema);

async function seed() {
  try {
    await mongoose.connect(mongodbUri);
    console.log('Database connected successfully.');

    // Clear all existing data for seeding
    console.log('Clearing old collections...');
    await User.deleteMany({});
    await Subject.deleteMany({});
    await Topic.deleteMany({});
    await Question.deleteMany({});
    await Test.deleteMany({});
    await SubscriptionPlan.deleteMany({});
    await UserSubscription.deleteMany({});
    await Attempt.deleteMany({});

    console.log('Creating demo users...');
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash('admin123', salt);
    const hashedTeacherPassword = await bcrypt.hash('teacher123', salt);
    const hashedStudentPassword = await bcrypt.hash('student123', salt);

    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@edugauge.com',
      password: hashedAdminPassword,
      role: 'ADMIN',
      status: 'active'
    });

    const teacherUser = await User.create({
      name: 'Dr. Jane Smith',
      email: 'teacher@edugauge.com',
      password: hashedTeacherPassword,
      role: 'TEACHER',
      status: 'active'
    });

    const studentUser1 = await User.create({
      name: 'Vijay Kumar',
      email: 'student@edugauge.com',
      password: hashedStudentPassword,
      role: 'STUDENT',
      status: 'active'
    });

    const studentUser2 = await User.create({
      name: 'Alice Johnson',
      email: 'student2@edugauge.com',
      password: hashedStudentPassword,
      role: 'STUDENT',
      status: 'active'
    });

    console.log('Creating subjects...');
    const csSubject = await Subject.create({
      name: 'Computer Science',
      description: 'Computing, programming and architecture core topics.'
    });

    const mathSubject = await Subject.create({
      name: 'Mathematics',
      description: 'Calculus, algebra, logic and numbers.'
    });

    const gsSubject = await Subject.create({
      name: 'General Studies',
      description: 'General intelligence, history, geography and general knowledge.'
    });

    console.log('Creating topics...');
    const dbTopic = await Topic.create({
      subjectId: csSubject._id,
      name: 'Database Normalization'
    });

    const linearTopic = await Topic.create({
      subjectId: mathSubject._id,
      name: 'Linear Algebra'
    });

    const historyTopic = await Topic.create({
      subjectId: gsSubject._id,
      name: 'Modern History'
    });

    console.log('Creating questions...');
    // CS Question 1
    const qCs1 = await Question.create({
      questionText: 'Which normal form deals with multi-valued dependencies?',
      type: 'MCQ',
      options: ['1NF', '2NF', '3NF', '4NF'],
      correctAnswer: 3, // index of '4NF'
      explanation: '4NF addresses multi-valued dependencies by isolating independent multi-valued facts.',
      subjectId: csSubject._id,
      topicId: dbTopic._id,
      marks: 10,
      negativeMarks: 2
    });

    // CS Question 2
    const qCs2 = await Question.create({
      questionText: 'In M-N relationships in database design, a junction/associative table is required.',
      type: 'TRUE_FALSE',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'Many-to-many relationships require a junction table to resolve the mapping in relational databases.',
      subjectId: csSubject._id,
      topicId: dbTopic._id,
      marks: 10,
      negativeMarks: 0
    });

    // CS Question 3 (Subjective)
    const qCs3 = await Question.create({
      questionText: 'Explain the difference between 3NF and BCNF.',
      type: 'SUBJECTIVE',
      correctAnswer: 'BCNF is a stronger form of 3NF where every determinant must be a superkey.',
      explanation: 'A table is in BCNF if for every one of its dependencies X -> Y, X is a superkey.',
      subjectId: csSubject._id,
      topicId: dbTopic._id,
      marks: 10,
      negativeMarks: 0
    });

    // Math Question 1
    const qMath1 = await Question.create({
      questionText: 'What is the determinant of a 2x2 identity matrix?',
      type: 'NUMERICAL',
      correctAnswer: '1',
      explanation: 'The identity matrix has 1s on the diagonal and 0s elsewhere. Determinant = (1*1) - (0*0) = 1.',
      subjectId: mathSubject._id,
      topicId: linearTopic._id,
      marks: 10,
      negativeMarks: 1
    });

    // Math Question 2
    const qMath2 = await Question.create({
      questionText: 'Which of the following are vector spaces? (Select all that apply)',
      type: 'MULTIPLE_CORRECT',
      options: ['R^n over R', 'Polynomials of degree <= n', 'Integer set Z over R', 'Matrices of size mxn'],
      correctAnswer: [0, 1, 3], // R^n, Polynomials, Matrices
      explanation: 'Integers Z do not form a vector space over R since scalar multiplication (e.g. 0.5 * 1) does not result in an integer.',
      subjectId: mathSubject._id,
      topicId: linearTopic._id,
      marks: 10,
      negativeMarks: 2
    });

    // GS Question 1
    const qGs1 = await Question.create({
      questionText: 'Who was the first President of the United States?',
      type: 'MCQ',
      options: ['Thomas Jefferson', 'John Adams', 'George Washington', 'Abraham Lincoln'],
      correctAnswer: 2, // George Washington
      explanation: 'George Washington served as the first president of the United States from 1789 to 1797.',
      subjectId: gsSubject._id,
      topicId: historyTopic._id,
      marks: 5,
      negativeMarks: 0
    });

    // GS Question 2
    const qGs2 = await Question.create({
      questionText: 'The French Revolution started in the year 1789.',
      type: 'TRUE_FALSE',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'The French Revolution began in July 1789 with the storming of the Bastille.',
      subjectId: gsSubject._id,
      topicId: historyTopic._id,
      marks: 5,
      negativeMarks: 0
    });

    console.log('Creating tests...');
    const testCs = await Test.create({
      title: 'Database Management Systems Final Quiz',
      description: 'Test your understanding of normalization, normal forms, and database design relationships.',
      subjectId: csSubject._id,
      duration: 20, // 20 minutes
      questions: [qCs1._id, qCs2._id, qCs3._id],
      totalMarks: 30,
      createdBy: teacherUser._id,
      status: 'PUBLISHED',
      testType: 'PRACTICE',
      attemptsAllowed: 0, // unlimited
      isPublic: false
    });

    const testMath = await Test.create({
      title: 'Calculus & Linear Algebra Mock Exam',
      description: 'Midterm practice test containing vector spaces, determinants, and matrix math.',
      subjectId: mathSubject._id,
      duration: 15,
      questions: [qMath1._id, qMath2._id],
      totalMarks: 20,
      createdBy: teacherUser._id,
      status: 'PUBLISHED',
      testType: 'PRACTICE',
      attemptsAllowed: 5,
      isPublic: false
    });

    const testGs = await Test.create({
      title: 'General History Quick Test',
      description: 'Rapid quiz on American presidents and the French Revolution.',
      subjectId: gsSubject._id,
      duration: 10,
      questions: [qGs1._id, qGs2._id],
      totalMarks: 10,
      createdBy: teacherUser._id,
      status: 'PUBLISHED',
      testType: 'PRACTICE',
      attemptsAllowed: 3,
      isPublic: false
    });

    console.log('Creating subscription plans...');
    const planFree = await SubscriptionPlan.create({
      name: 'Free Basic Tier',
      description: 'Perfect for beginners. Provides access to our Computer Science foundational quizzes with up to 2 attempts.',
      price: 0,
      availableTests: [testCs._id],
      durationDays: 30,
      attemptsPerTest: 2,
      isActive: true
    });

    const planPremium = await SubscriptionPlan.create({
      name: 'Premium All-Access Pass',
      description: 'Complete syllabus access. Covers Computer Science, Mathematics, and General History tests with up to 5 attempts each.',
      price: 49,
      availableTests: [testCs._id, testMath._id, testGs._id],
      durationDays: 90,
      attemptsPerTest: 5,
      isActive: true
    });

    const planLifetime = await SubscriptionPlan.create({
      name: 'Ultimate Lifetime Pack',
      description: 'Unlimited access to all existing and future exams with custom extended attempt limits.',
      price: 199,
      availableTests: [testCs._id, testMath._id, testGs._id],
      expiryDate: new Date('2028-12-31T23:59:59Z'),
      attemptsPerTest: 99,
      isActive: true
    });

    console.log('Creating active student subscriptions...');
    // student 1 (Vijay) gets Premium Pass
    const activeSub1 = await UserSubscription.create({
      userId: studentUser1._id,
      planId: planPremium._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      status: 'ACTIVE'
    });

    // student 2 (Alice) gets Free Pass
    const activeSub2 = await UserSubscription.create({
      userId: studentUser2._id,
      planId: planFree._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'ACTIVE'
    });

    console.log('Creating demo attempts for stats representation...');
    // Create completed attempt for Vijay
    await Attempt.create({
      studentId: studentUser1._id,
      testId: testCs._id,
      answers: [
        { questionId: qCs1._id, answer: 3, isCorrect: true, marksObtained: 10, feedback: qCs1.explanation },
        { questionId: qCs2._id, answer: 'True', isCorrect: true, marksObtained: 10, feedback: qCs2.explanation },
        { questionId: qCs3._id, answer: 'BCNF determinant is superkey.', isCorrect: true, marksObtained: 8, feedback: 'Good explanation.' }
      ],
      score: 28,
      accuracy: 100,
      completionTime: 450, // 7.5 mins
      isCompleted: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });

    await Attempt.create({
      studentId: studentUser1._id,
      testId: testMath._id,
      answers: [
        { questionId: qMath1._id, answer: '1', isCorrect: true, marksObtained: 10, feedback: qMath1.explanation },
        { questionId: qMath2._id, answer: [0, 1], isCorrect: false, marksObtained: -2, feedback: qMath2.explanation }
      ],
      score: 8,
      accuracy: 50,
      completionTime: 300,
      isCompleted: true,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    });

    console.log('Seeding completed successfully!');

    // Generate help.txt
    const helpFilePath = path.join(__dirname, 'help.txt');
    const helpContent = `========================================================================
EXAMINATION PLATFORM - DATABASE DEMO SEED DETAILS & HELP GUIDE
========================================================================

1. LOGIN CREDENTIALS
------------------------------------------------------------------------
A) SUPER ADMINISTRATOR ACCOUNT:
   - Email: admin@edugauge.com
   - Password: admin123
   - Capabilities: Manage subscriptions (create, view, delete), view users list, view telemetry

B) TEACHER ACCOUNT:
   - Email: teacher@edugauge.com
   - Password: teacher123
   - Capabilities: Create and manage subjects, topics, questions, and published exams

C) STUDENT 1 ACCOUNT (Active Premium Pass subscription):
   - Email: student@edugauge.com
   - Password: student123
   - Capabilities: Access all 3 exams (CS, Math, History), track remaining attempts (5 per test)

D) STUDENT 2 ACCOUNT (Active Free Basic Tier subscription):
   - Email: student2@edugauge.com
   - Password: student123
   - Capabilities: Access ONLY Computer Science exam, track remaining attempts (2 per test)


2. DEMO SUBSCRIPTION PLANS
------------------------------------------------------------------------
- Free Basic Tier (Price: $0)
  - Validity: 30 Days
  - Attempt Limit: 2 per test
  - Included Exams: "Database Management Systems Final Quiz" (Computer Science)

- Premium All-Access Pass (Price: $49)
  - Validity: 90 Days
  - Attempt Limit: 5 per test
  - Included Exams: All 3 exams (DBMS, Calculus & Algebra, General History)

- Ultimate Lifetime Pack (Price: $199)
  - Validity: Fixed Expiration (until 2028-12-31)
  - Attempt Limit: 99 per test
  - Included Exams: All 3 exams


3. DEMO TESTS CONFIGURATION
------------------------------------------------------------------------
A) "Database Management Systems Final Quiz"
   - Subject: Computer Science
   - Duration: 20 minutes
   - Questions: 3 (MCQ, True/False, Subjective)
   - Total Marks: 30

B) "Calculus & Linear Algebra Mock Exam"
   - Subject: Mathematics
   - Duration: 15 minutes
   - Questions: 2 (Numerical, Multiple Correct)
   - Total Marks: 20

C) "General History Quick Test"
   - Subject: General Studies
   - Duration: 10 minutes
   - Questions: 2 (MCQ, True/False)
   - Total Marks: 10


4. TESTING AND VERIFICATION FLOW
------------------------------------------------------------------------
- Launch the application: 'npm run dev'
- Open http://localhost:3000/login
- Log in as 'admin@edugauge.com' (password: admin123). Go to the "Subscriptions" tab to see all plans, create new plans dynamically, and check active student subscriptions.
- Log in as 'student@edugauge.com' (password: student123) to view their dashboard. They have 2 recent attempts populated, stats (accuracy/score), and can attempt the tests included in the Premium Pass subscription.
- Log in as 'student2@edugauge.com' (password: student123). Go to their dashboard. Since they are on the "Free Basic Tier", they will see ONLY the "Database Management Systems Final Quiz" and cannot see the math/history exams.
- Try registering a new student at http://localhost:3000/register. Upon logging in for the first time, they will have no active subscription. They will be automatically redirected to the "Choose a Subscription Plan" selection page. They can select any plan (e.g. Premium Pass) and click "Subscribe" to activate it without paying.

========================================================================
`;

    fs.writeFileSync(helpFilePath, helpContent, 'utf-8');
    console.log('help.txt file created successfully.');

  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

seed();
