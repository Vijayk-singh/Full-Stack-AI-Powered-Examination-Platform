const fs = require('fs');

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch(e) {
    data = {};
  }
  return { ok: res.ok, status: res.status, data };
}

async function testApp() {
  console.log("==========================================");
  console.log("EduGauge AI - Application Functionality Test Report");
  console.log("==========================================\n");

  const baseUrl = "http://localhost:3002/api";
  const results = [];

  function logResult(step, endpoint, passed, details) {
    const status = passed ? "✅ PASSED" : "❌ FAILED";
    console.log(`[${status}] ${step} - ${endpoint}`);
    if (details) console.log(`   Details: ${details}\n`);
    results.push({ step, endpoint, passed, details });
  }

  try {
    // 1. Authenticate as Teacher
    let res = await fetchJson(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "teacher@edugauge.com", password: "teacher123" })
    });
    const teacherToken = res.data?.data?.accessToken;
    logResult("Teacher Login", "POST /api/auth/login", res.ok, `Token obtained: ${!!teacherToken}`);

    // 1b. Authenticate as Admin
    res = await fetchJson(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@edugauge.com", password: "admin123" })
    });
    const adminToken = res.data?.data?.accessToken;
    logResult("Admin Login", "POST /api/auth/login", res.ok, `Token obtained: ${!!adminToken}`);

    // 2. Register a New Student
    const newStudentEmail = `student_${Date.now()}@test.com`;
    res = await fetchJson(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Student", email: newStudentEmail, password: "password123", role: "STUDENT" })
    });
    logResult("Student Registration", "POST /api/auth/register", res.ok, `Registered with email: ${newStudentEmail}`);

    // 3. Login as New Student
    res = await fetchJson(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newStudentEmail, password: "password123" })
    });
    const studentToken = res.data?.data?.accessToken;
    logResult("Student Login", "POST /api/auth/login", res.ok, `Token obtained: ${!!studentToken}`);

    // 4. Get existing Subject
    res = await fetchJson(`${baseUrl}/subjects`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${teacherToken}` }
    });
    const subjects = res.data?.data || [];
    const subjectId = subjects.length > 0 ? subjects[0]._id : null;
    logResult("Get Subject", "GET /api/subjects", res.ok && !!subjectId, `Subject ID: ${subjectId}`);

    // 5. Get existing Topic
    res = await fetchJson(`${baseUrl}/topics?subjectId=${subjectId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${teacherToken}` }
    });
    const topics = res.data?.data || [];
    const topicId = topics.length > 0 ? topics[0]._id : null;
    logResult("Get Topic", "GET /api/topics", res.ok && !!topicId, `Topic ID: ${topicId}`);

    let questionId = null;
    if (subjectId && topicId) {
      // 6. Teacher creates a Question
      res = await fetchJson(`${baseUrl}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          questionText: "What status code is for OK?",
          type: "MCQ",
          options: ["200", "400", "500", "404"],
          correctAnswer: 0,
          subjectId,
          topicId,
          marks: 10
        })
      });
      questionId = res.data?.data?._id;
      logResult("Create Question (Teacher)", "POST /api/questions", res.ok, `Question ID: ${questionId}`);
    }

    let testId = null;
    if (questionId) {
      // 7. Teacher creates a Test
      res = await fetchJson(`${baseUrl}/tests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          title: `Automated API Test ${Date.now()}`,
          subjectId,
          duration: 10,
          questions: [questionId]
        })
      });
      testId = res.data?.data?._id;
      logResult("Create Test (Teacher)", "POST /api/tests", res.ok, `Test ID: ${testId}`);
    }

    if (testId) {
      // 8. Publish the Test
      res = await fetchJson(`${baseUrl}/tests/${testId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${teacherToken}`
        },
        body: JSON.stringify({ status: "PUBLISHED" })
      });
      logResult("Publish Test (Teacher)", "PUT /api/tests/:id/status", res.ok, `Test Status: ${res.data?.data?.status}`);

      // 8b. Admin creates a Subscription Plan
      res = await fetchJson(`${baseUrl}/subscriptions/plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: `Test Plan ${Date.now()}`,
          price: 10,
          attemptsPerTest: 5,
          availableTests: [testId],
          isActive: true
        })
      });
      const planId = res.data?.data?._id;
      logResult("Create Subscription Plan (Admin)", "POST /api/subscriptions/plans", res.ok, `Plan ID: ${planId}`);

      // 8c. Student Subscribes to Plan
      if (planId) {
        res = await fetchJson(`${baseUrl}/subscriptions/user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${studentToken}`
          },
          body: JSON.stringify({ planId })
        });
        logResult("Student Subscribe to Plan", "POST /api/subscriptions/user", res.ok, `Subscribed successfully`);
      }

      // 9. Student Lists Tests
      res = await fetchJson(`${baseUrl}/tests`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${studentToken}` }
      });
      const studentTests = res.data?.data?.tests || [];
      const canSeeTest = studentTests.some(t => t._id === testId);
      logResult("Student View Tests", "GET /api/tests", canSeeTest, `Can see newly created test: ${canSeeTest}`);

      // 10. Student Starts Attempt
      res = await fetchJson(`${baseUrl}/attempts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${studentToken}`
        },
        body: JSON.stringify({ testId })
      });
      
      const attemptId = res.data?.data?._id;
      if (!res.ok) {
        logResult("Student Start Attempt", "POST /api/attempts", false, res.data?.error || "Failed to start attempt");
      } else {
        logResult("Student Start Attempt", "POST /api/attempts", res.ok, `Attempt ID: ${attemptId}`);

        // 11. Student Submits Attempt
        res = await fetchJson(`${baseUrl}/attempts/${attemptId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${studentToken}`
          },
          body: JSON.stringify({
            answers: [{ questionId, answer: 0 }],
            completionTime: 60
          })
        });
        logResult("Student Submit Attempt", "POST /api/attempts/:id", res.ok, `Score: ${res.data?.data?.score}, Accuracy: ${res.data?.data?.accuracy}%`);
      }
    } else {
       logResult("Skip further tests", "", false, "No Test ID generated.");
    }
  } catch (err) {
    console.error("Test script encountered an error:", err);
  }

  console.log("\n==========================================");
  console.log("Summary of Test Run");
  console.log("==========================================");
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  
  if (total !== passed) {
    console.log("\nThere were failed tests. See details above.");
  } else {
    console.log("\nAll core flows completed successfully.");
  }
}

testApp();
