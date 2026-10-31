import {
  StudentProfile,
  StudentChapterProgress,
  StudyPlan,
  TestAttempt,
  ChatMessage,
} from "@/types/hsc";
import { HSC_SCIENCE_SYLLABUS } from "@/data/hsc-syllabus";
import { VERIFIED_QUESTION_BANK } from "@/data/question-bank";

function getRelativeDateString(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

export function createDemoStudentProfile(): StudentProfile {
  return {
    id: "demo-student-tahmid-2026",
    fullName: "Tahmid Hasan (Demo Sample)",
    collegeName: "Notre Dame College, Dhaka (Sample Profile)",
    hscYear: 2026,
    academicGroup: "Science",
    enrolledSubjectIds: [
      "physics",
      "chemistry",
      "higher-math",
      "biology",
      "ict",
      "english",
      "bangla",
    ],
    fourthSubjectId: "biology",
    preferredLanguage: "Bangla & English",
    dailyStudyHours: 4.5,
    targetExamName: "HSC Pre-Test & Term Finale (Sample)",
    targetExamDate: getRelativeDateString(24),
    isDemo: true,
    onboardingCompleted: true,
  };
}

export function createDemoChapterProgress(): Record<string, StudentChapterProgress> {
  const map: Record<string, StudentChapterProgress> = {};
  const today = new Date().toISOString();

  // Initialize all chapters as not_started with null mastery ("Not assessed")
  for (const subject of HSC_SCIENCE_SYLLABUS) {
    for (const paper of subject.papers) {
      for (const ch of paper.chapters) {
        map[ch.id] = {
          chapterId: ch.id,
          status: "not_started",
          completionPercentage: 0,
          estimatedMasteryPercentage: null,
          confidenceLevel: 20,
          completedActivities: {
            basics: false,
            formulas: false,
            tutorial: false,
            mcq: false,
            cq: false,
            quiz: false,
          },
          lastStudiedAt: null,
          lastTestedAt: null,
          lastTestScore: null,
          testAttemptsCount: 0,
        };
      }
    }
  }

  // Strong / Mastered Chapters (backed by assessment evidence)
  map["phy1-ch2"] = {
    chapterId: "phy1-ch2",
    status: "mastered",
    completionPercentage: 100,
    estimatedMasteryPercentage: 88,
    confidenceLevel: 90,
    completedActivities: {
      basics: true,
      formulas: true,
      tutorial: true,
      mcq: true,
      cq: true,
      quiz: true,
    },
    lastStudiedAt: today,
    lastTestedAt: today,
    lastTestScore: 88,
    testAttemptsCount: 2,
  };

  map["chem1-ch2"] = {
    chapterId: "chem1-ch2",
    status: "mastered",
    completionPercentage: 90,
    estimatedMasteryPercentage: 84,
    confidenceLevel: 85,
    completedActivities: {
      basics: true,
      formulas: true,
      tutorial: true,
      mcq: true,
      cq: true,
      quiz: false,
    },
    lastStudiedAt: today,
    lastTestedAt: today,
    lastTestScore: 84,
    testAttemptsCount: 1,
  };

  map["hm1-ch1"] = {
    chapterId: "hm1-ch1",
    status: "mastered",
    completionPercentage: 100,
    estimatedMasteryPercentage: 92,
    confidenceLevel: 92,
    completedActivities: {
      basics: true,
      formulas: true,
      tutorial: true,
      mcq: true,
      cq: true,
      quiz: true,
    },
    lastStudiedAt: today,
    lastTestedAt: today,
    lastTestScore: 92,
    testAttemptsCount: 2,
  };

  map["ict-ch3"] = {
    chapterId: "ict-ch3",
    status: "mastered",
    completionPercentage: 85,
    estimatedMasteryPercentage: 82,
    confidenceLevel: 85,
    completedActivities: {
      basics: true,
      formulas: true,
      tutorial: true,
      mcq: true,
      cq: false,
      quiz: true,
    },
    lastStudiedAt: today,
    lastTestedAt: today,
    lastTestScore: 82,
    testAttemptsCount: 1,
  };

  // Weak / Revision Needed Chapters (revealed by mock test)
  map["phy1-ch4"] = {
    chapterId: "phy1-ch4",
    status: "revision_needed",
    completionPercentage: 50,
    estimatedMasteryPercentage: 42,
    confidenceLevel: 45,
    completedActivities: {
      basics: true,
      formulas: true,
      tutorial: true,
      mcq: false,
      cq: false,
      quiz: false,
    },
    lastStudiedAt: today,
    lastTestedAt: today,
    lastTestScore: 42,
    testAttemptsCount: 1,
  };

  map["chem2-ch2"] = {
    chapterId: "chem2-ch2",
    status: "revision_needed",
    completionPercentage: 40,
    estimatedMasteryPercentage: 38,
    confidenceLevel: 35,
    completedActivities: {
      basics: true,
      formulas: false,
      tutorial: true,
      mcq: false,
      cq: false,
      quiz: false,
    },
    lastStudiedAt: today,
    lastTestedAt: today,
    lastTestScore: 38,
    testAttemptsCount: 1,
  };

  map["hm1-ch9"] = {
    chapterId: "hm1-ch9",
    status: "revision_needed",
    completionPercentage: 50,
    estimatedMasteryPercentage: 48,
    confidenceLevel: 50,
    completedActivities: {
      basics: true,
      formulas: true,
      tutorial: true,
      mcq: false,
      cq: false,
      quiz: false,
    },
    lastStudiedAt: today,
    lastTestedAt: today,
    lastTestScore: 48,
    testAttemptsCount: 1,
  };

  // Practicing / In-Progress Chapters (Some assessed, some not assessed yet)
  map["phy1-ch5"] = {
    chapterId: "phy1-ch5",
    status: "practicing",
    completionPercentage: 75,
    estimatedMasteryPercentage: 70,
    confidenceLevel: 72,
    completedActivities: {
      basics: true,
      formulas: true,
      tutorial: true,
      mcq: true,
      cq: false,
      quiz: false,
    },
    lastStudiedAt: today,
    lastTestedAt: today,
    lastTestScore: 70,
    testAttemptsCount: 1,
  };

  map["chem1-ch4"] = {
    chapterId: "chem1-ch4",
    status: "practicing",
    completionPercentage: 65,
    estimatedMasteryPercentage: null, // Explicitly demonstrates "Not assessed" despite high task completion
    confidenceLevel: 68,
    completedActivities: {
      basics: true,
      formulas: true,
      tutorial: true,
      mcq: false,
      cq: true,
      quiz: false,
    },
    lastStudiedAt: today,
    lastTestedAt: null,
    lastTestScore: null,
    testAttemptsCount: 0,
  };

  map["bio1-ch1"] = {
    chapterId: "bio1-ch1",
    status: "learning",
    completionPercentage: 40,
    estimatedMasteryPercentage: null,
    confidenceLevel: 55,
    completedActivities: {
      basics: true,
      formulas: false,
      tutorial: true,
      mcq: false,
      cq: false,
      quiz: false,
    },
    lastStudiedAt: today,
    lastTestedAt: null,
    lastTestScore: null,
    testAttemptsCount: 0,
  };

  map["eng2-ch1"] = {
    chapterId: "eng2-ch1",
    status: "practicing",
    completionPercentage: 65,
    estimatedMasteryPercentage: 75,
    confidenceLevel: 75,
    completedActivities: {
      basics: true,
      formulas: true,
      tutorial: true,
      mcq: true,
      cq: false,
      quiz: false,
    },
    lastStudiedAt: today,
    lastTestedAt: today,
    lastTestScore: 75,
    testAttemptsCount: 1,
  };

  map["ban1-ch1"] = {
    chapterId: "ban1-ch1",
    status: "learning",
    completionPercentage: 35,
    estimatedMasteryPercentage: null,
    confidenceLevel: 60,
    completedActivities: {
      basics: true,
      formulas: true,
      tutorial: false,
      mcq: false,
      cq: false,
      quiz: false,
    },
    lastStudiedAt: today,
    lastTestedAt: null,
    lastTestScore: null,
    testAttemptsCount: 0,
  };

  return map;
}

export function createDemoStudyPlan(): StudyPlan {
  const today = getRelativeDateString(0);
  const tomorrow = getRelativeDateString(1);
  const dayAfter = getRelativeDateString(2);
  const day3 = getRelativeDateString(3);

  return {
    id: "demo-plan-hsc-2026",
    title: "HSC Science High-Yield Recovery & Mastery Plan (Sample)",
    examName: "HSC Pre-Test & Term Finale (Sample)",
    examDate: getRelativeDateString(24),
    dailyStudyMinutes: 270, // 4.5 hours/day
    totalAvailableMinutes: 24 * 270,
    estimatedRequiredMinutes: 5120,
    feasibilityWarning: null,
    isActive: true,
    sourceType: "selected_chapters",
    createdAt: new Date().toISOString(),
    tasks: [
      // TODAY'S TASKS
      {
        id: "task-demo-1",
        planId: "demo-plan-hsc-2026",
        subjectId: "physics",
        chapterId: "phy1-ch4",
        scheduledDate: today,
        title: "Understand Moment of Inertia & Parallel/Perpendicular Axis Theorems",
        description:
          "Study core derivations for cylinder, rod, and sphere moment of inertia and radius of gyration.",
        taskType: "learn_basics",
        estimatedDurationMinutes: 35,
        actualDurationMinutes: 35,
        priority: "high",
        resourceSearchQuery: "HSC Physics Moment of Inertia Theorem Bangla",
        isCompleted: true,
        completedAt: new Date().toISOString(),
      },
      {
        id: "task-demo-2",
        planId: "demo-plan-hsc-2026",
        subjectId: "physics",
        chapterId: "phy1-ch4",
        scheduledDate: today,
        title: "Study Road Banking Force Diagrams & Worked Examples",
        description:
          "Master tanθ = v²/rg and banking with friction for curved tracks and railway lines.",
        taskType: "review_formulas",
        estimatedDurationMinutes: 30,
        actualDurationMinutes: 0,
        priority: "high",
        resourceSearchQuery: "HSC Physics Road Banking Math CQ Bangla",
        isCompleted: false,
        completedAt: null,
      },
      {
        id: "task-demo-3",
        planId: "demo-plan-hsc-2026",
        subjectId: "physics",
        chapterId: "phy1-ch4",
        scheduledDate: today,
        title: "Solve 15 Board MCQs on Newtonian Mechanics",
        description:
          "Focus on angular momentum conservation, recoil velocity, and banking angle calculations.",
        taskType: "solve_mcq",
        estimatedDurationMinutes: 25,
        actualDurationMinutes: 0,
        priority: "high",
        resourceSearchQuery: "HSC Physics Chapter 4 Newtonian Mechanics Board MCQ Solve",
        isCompleted: false,
        completedAt: null,
      },
      {
        id: "task-demo-4",
        planId: "demo-plan-hsc-2026",
        subjectId: "chemistry",
        chapterId: "chem2-ch2",
        scheduledDate: today,
        title: "Compare SN1 vs SN2 Reaction Mechanisms & Carbocation Stability",
        description:
          "Watch tutorial and write down stereochemical inversion vs racemization notes.",
        taskType: "watch_tutorial",
        estimatedDurationMinutes: 40,
        actualDurationMinutes: 0,
        priority: "high",
        resourceSearchQuery: "HSC Organic Chemistry SN1 SN2 Mechanism Bangla",
        isCompleted: false,
        completedAt: null,
      },
      {
        id: "task-demo-5",
        planId: "demo-plan-hsc-2026",
        subjectId: "chemistry",
        chapterId: "chem2-ch2",
        scheduledDate: today,
        title: "Solve 2 Creative Questions (CQ) on Aldehyde vs Ketone Identification",
        description:
          "Practice Tollens' Silver Mirror test, Fehling's solution test, and Clemmensen/Wolff-Kishner reductions.",
        taskType: "solve_cq",
        estimatedDurationMinutes: 45,
        actualDurationMinutes: 0,
        priority: "high",
        resourceSearchQuery: "HSC Organic Chemistry Aldehyde Ketone Tollens Test CQ Bangla",
        isCompleted: false,
        completedAt: null,
      },

      // TOMORROW'S TASKS
      {
        id: "task-demo-6",
        planId: "demo-plan-hsc-2026",
        subjectId: "higher-math",
        chapterId: "hm1-ch9",
        scheduledDate: tomorrow,
        title: "Master Standard Limits & L'Hôpital / Trigonometric Indeterminate Forms",
        description: "Review (1 - cos 2x)/x², sin x/x, and exponential limit shortcuts.",
        taskType: "learn_basics",
        estimatedDurationMinutes: 40,
        actualDurationMinutes: 0,
        priority: "high",
        resourceSearchQuery: "HSC Higher Math 1st Paper Chapter 9 Limit Differentiation Bangla",
        isCompleted: false,
        completedAt: null,
      },
      {
        id: "task-demo-7",
        planId: "demo-plan-hsc-2026",
        subjectId: "higher-math",
        chapterId: "hm1-ch9",
        scheduledDate: tomorrow,
        title: "Solve 2 CQs on Successive Differentiation & Maxima-Minima",
        description: "Practice y_n derivations and finding local extrema of cubic functions.",
        taskType: "solve_cq",
        estimatedDurationMinutes: 50,
        actualDurationMinutes: 0,
        priority: "high",
        resourceSearchQuery: "HSC Higher Math Successive Differentiation Maxima Minima CQ Bangla",
        isCompleted: false,
        completedAt: null,
      },
      {
        id: "task-demo-8",
        planId: "demo-plan-hsc-2026",
        subjectId: "chemistry",
        chapterId: "chem1-ch4",
        scheduledDate: tomorrow,
        title: "Complete Checkpoint Quiz on Kp, Kc & Henderson-Hasselbalch Buffer pH",
        description: "Verify mastery on Chemical Changes since this chapter is currently unassessed.",
        taskType: "checkpoint_quiz",
        estimatedDurationMinutes: 25,
        actualDurationMinutes: 0,
        priority: "medium",
        resourceSearchQuery: "HSC Chemistry Chapter 4 Buffer Solution pH Math Bangla",
        isCompleted: false,
        completedAt: null,
      },

      // DAY +2 TASKS
      {
        id: "task-demo-9",
        planId: "demo-plan-hsc-2026",
        subjectId: "biology",
        chapterId: "bio1-ch9",
        scheduledDate: dayAfter,
        title: "Compare C3 vs C4 Hatch-Slack Cycle & Kranz Anatomy",
        description: "Draw schematic pathway diagrams for C3 and C4 photosynthesis.",
        taskType: "learn_basics",
        estimatedDurationMinutes: 45,
        actualDurationMinutes: 0,
        priority: "medium",
        resourceSearchQuery: "HSC Biology 1st Paper Chapter 9 C3 C4 Cycle Bangla",
        isCompleted: false,
        completedAt: null,
      },
      {
        id: "task-demo-10",
        planId: "demo-plan-hsc-2026",
        subjectId: "english",
        chapterId: "eng2-ch1",
        scheduledDate: dayAfter,
        title: "Practice 10 Board Passage Modifiers & Sentence Connectors",
        description: "Focus on pre-modifiers (participles, noun-adjectives) and logical transition connectors.",
        taskType: "review_formulas",
        estimatedDurationMinutes: 35,
        actualDurationMinutes: 0,
        priority: "medium",
        resourceSearchQuery: "HSC English 2nd Paper Modifiers Connectors Practice Bangla",
        isCompleted: false,
        completedAt: null,
      },

      // DAY +3 TASKS
      {
        id: "task-demo-11",
        planId: "demo-plan-hsc-2026",
        subjectId: "ict",
        chapterId: "ict-ch5",
        scheduledDate: day3,
        title: "Write & Trace C Programs for Series Loops (for / while / do-while)",
        description: "Convert flowcharts to C code and practice GCD, factorial, and Fibonacci loops.",
        taskType: "learn_basics",
        estimatedDurationMinutes: 45,
        actualDurationMinutes: 0,
        priority: "high",
        resourceSearchQuery: "HSC ICT Chapter 5 C Programming Series Loop Bangla",
        isCompleted: false,
        completedAt: null,
      },
    ],
  };
}

export function createDemoTestAttempts(): TestAttempt[] {
  const sampleQuestions = VERIFIED_QUESTION_BANK.slice(0, 8);
  return [
    {
      id: "demo-attempt-1",
      title: "Physics & Chemistry Diagnostic Readiness Check (Sample)",
      testType: "diagnostic",
      subjectId: "physics",
      chapterId: "phy1-ch4",
      totalQuestions: 8,
      correctCount: 5,
      incorrectCount: 3,
      unansweredCount: 0,
      accuracyPercentage: 62.5,
      timeTakenSeconds: 410,
      timeLimitSeconds: 600,
      aiSummary:
        "Strong conceptual accuracy in Vector Resolution (100%) and Work-Energy basics, but missed 2 of 3 questions on Moment of Inertia, Rotational Kinetic Energy, and Road Banking in Newtonian Mechanics. Prioritize targeted formula drills on Chapter 4.",
      weakTopics: [
        "Moment of Inertia, Torque, Angular Momentum & Banking of Roads",
        "SN1/SN2, Electrophilic Substitution, Aldehyde/Ketone, Amine & Functional Group Tests",
      ],
      strongTopics: [
        "Vector Addition, Resolution & River-Boat Problems",
        "Work-Energy Theorem, Variable Force & Spring Potential Energy",
      ],
      limitedEvidenceWarning: false,
      completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      questions: sampleQuestions,
      answers: sampleQuestions.map((q, idx) => {
        const isCorrect = idx !== 3 && idx !== 4 && idx !== 6;
        return {
          questionId: q.id,
          selectedOptionIndex: isCorrect ? q.correctAnswerIndex : (q.correctAnswerIndex + 1) % 4,
          isCorrect,
          timeSpentSeconds: 51,
        };
      }),
      topicBreakdown: [
        {
          topic: "Vector Addition, Resolution & River-Boat Problems",
          chapterId: "phy1-ch2",
          subjectId: "physics",
          questionsCount: 2,
          correctCount: 2,
          accuracyPercentage: 100,
        },
        {
          topic: "Moment of Inertia, Torque, Angular Momentum & Banking of Roads",
          chapterId: "phy1-ch4",
          subjectId: "physics",
          questionsCount: 3,
          correctCount: 1,
          accuracyPercentage: 33.3,
        },
        {
          topic: "Work-Energy Theorem, Variable Force & Spring Potential Energy",
          chapterId: "phy1-ch5",
          subjectId: "physics",
          questionsCount: 3,
          correctCount: 2,
          accuracyPercentage: 66.7,
        },
      ],
    },
  ];
}

export function createDemoChatHistory(): ChatMessage[] {
  return [
    {
      id: "msg-welcome-1",
      role: "assistant",
      content:
        "আসসালামু আলাইকুম তাহমিদ! 👋 আমি তোমার **HSCBuddy AI Study Mentor**।\n\nতোমার বর্তমান প্রোফাইল ও ডায়াগনস্টিক টেস্ট অনুযায়ী:\n- **শক্তিশালী অধ্যায়:** ভেক্টর (৮৮% মাস্টারি), ম্যাট্রিক্স ও নির্ণায়ক (৯২% মাস্টারি), এবং গুণগত রসায়ন (৮৪% মাস্টারি)।\n- **জরুরি মনোযোগ প্রয়োজন (Weak Areas):** পদার্থবিজ্ঞান ১ম পত্রের **নিউটনীয় বলবিদ্যা (৪২% মাস্টারি)**, রসায়ন ২য় পত্রের **জৈব রসায়ন (৩৮% মাস্টারি)** এবং উচ্চতর গণিত ১ম পত্রের **অন্তরীকরণ (৪৮% মাস্টারি)**।\n- **পরবর্তী পরীক্ষা:** HSC Pre-Test & Term Finale (২৪ দিন বাকি)।\n\nতুমি চাইলে আমাকে যেকোনো টপিক বাংলায় বা ইংরেজিতে বুঝিয়ে দিতে বলতে পারো, অথবা আজকের স্টাডি প্ল্যান ও কুইজ নিয়ে কথা বলতে পারো!",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      isAiLive: false,
      suggestedActions: [
        {
          id: "act-1",
          label: "Quiz me on Newtonian Mechanics",
          actionType: "start_quiz",
          payload: { subjectId: "physics", chapterId: "phy1-ch4" },
        },
        {
          id: "act-2",
          label: "Open Today's Study Tasks",
          actionType: "open_planner",
        },
        {
          id: "act-3",
          label: "Generate Targeted Revision Plan",
          actionType: "generate_revision_plan",
        },
      ],
    },
  ];
}

