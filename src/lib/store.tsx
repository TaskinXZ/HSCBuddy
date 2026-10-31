"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  StudentProfile,
  StudentChapterProgress,
  StudyPlan,
  StudyTask,
  TestAttempt,
  ChatMessage,
  ChapterStatus,
  ChapterActivities,
} from "@/types/hsc";
import { HSC_SCIENCE_SYLLABUS, getAllChapters, getChapterById } from "@/data/hsc-syllabus";
import {
  createDemoStudentProfile,
  createDemoChapterProgress,
  createDemoStudyPlan,
  createDemoTestAttempts,
  createDemoChatHistory,
} from "@/data/demo-seed";
import {
  calculateActivityCompletion,
  deriveChapterStatus,
  getDaysRemaining,
} from "@/lib/utils";

const STORAGE_KEY = "hscbuddy_unified_state_v1";

interface OverallStats {
  totalChapters: number;
  masteredChapters: number;
  inProgressChapters: number;
  revisionNeededChapters: number;
  notStartedChapters: number;
  weightedCompletionPercentage: number;
  averageAssessedMastery: number | null;
  assessedChaptersCount: number;
  confirmedStudyMinutes: number;
  completedTasksCount: number;
  totalTasksCount: number;
}

interface SubjectStat {
  subjectId: string;
  nameEn: string;
  nameBn: string;
  accentColor: string;
  totalChapters: number;
  weightedCompletion: number;
  averageMastery: number | null;
  assessedCount: number;
  weakCount: number;
  masteredCount: number;
}

interface HSCBuddyContextValue {
  isHydrated: boolean;
  profile: StudentProfile;
  chapterProgress: Record<string, StudentChapterProgress>;
  studyPlan: StudyPlan | null;
  testAttempts: TestAttempt[];
  chatMessages: ChatMessage[];
  updateProfile: (partial: Partial<StudentProfile>) => void;
  resetToDemoAccount: () => void;
  initializeStudentAccount: (newProfile: Omit<StudentProfile, "id" | "isDemo" | "onboardingCompleted">) => void;
  updateChapterActivity: (
    chapterId: string,
    activityKey: keyof ChapterActivities,
    completed: boolean
  ) => void;
  updateChapterStatusManual: (chapterId: string, status: ChapterStatus) => void;
  updateChapterConfidence: (chapterId: string, confidence: number) => void;
  updateChapterEffortWeight: (chapterId: string, weight: number) => void;
  toggleStudyTask: (taskId: string) => void;
  setActiveStudyPlan: (plan: StudyPlan, preserveCompleted?: boolean) => void;
  rebalanceActivePlan: (newDailyHours?: number, newExamDate?: string) => void;
  recordTestAttempt: (attempt: TestAttempt) => void;
  generateTargetedRevisionPlan: (weakChapterIds?: string[]) => StudyPlan;
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;
  getOverallStats: () => OverallStats;
  getSubjectStats: () => SubjectStat[];
  getWeakChapters: () => Array<{
    chapterId: string;
    titleEn: string;
    titleBn: string;
    subjectId: string;
    subjectNameEn: string;
    accentColor: string;
    mastery: number | null;
    completion: number;
    status: ChapterStatus;
    effortWeight: number;
  }>;
  getTodaysTasks: () => StudyTask[];
  getCompactMentorContext: () => Record<string, unknown>;
}

const HSCBuddyContext = createContext<HSCBuddyContextValue | null>(null);

export function HSCBuddyProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [profile, setProfile] = useState<StudentProfile>(() => createDemoStudentProfile());
  const [chapterProgress, setChapterProgress] = useState<Record<string, StudentChapterProgress>>(
    () => createDemoChapterProgress()
  );
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(() => createDemoStudyPlan());
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>(() => createDemoTestAttempts());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => createDemoChatHistory());

  // Load persisted state from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.chapterProgress) setChapterProgress(parsed.chapterProgress);
        if (parsed.studyPlan !== undefined) setStudyPlan(parsed.studyPlan);
        if (parsed.testAttempts) setTestAttempts(parsed.testAttempts);
        if (parsed.chatMessages) setChatMessages(parsed.chatMessages);
      }
    } catch (e) {
      console.warn("Failed to hydrate HSCBuddy state from localStorage:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profile,
          chapterProgress,
          studyPlan,
          testAttempts,
          chatMessages,
        })
      );
    } catch (e) {
      console.warn("Failed to persist HSCBuddy state:", e);
    }
  }, [isHydrated, profile, chapterProgress, studyPlan, testAttempts, chatMessages]);

  const updateProfile = useCallback((partial: Partial<StudentProfile>) => {
    setProfile((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetToDemoAccount = useCallback(() => {
    const demoProfile = createDemoStudentProfile();
    const demoProgress = createDemoChapterProgress();
    const demoPlan = createDemoStudyPlan();
    const demoTests = createDemoTestAttempts();
    const demoChats = createDemoChatHistory();

    setProfile(demoProfile);
    setChapterProgress(demoProgress);
    setStudyPlan(demoPlan);
    setTestAttempts(demoTests);
    setChatMessages(demoChats);
  }, []);

  const initializeStudentAccount = useCallback(
    (newProfileData: Omit<StudentProfile, "id" | "isDemo" | "onboardingCompleted">) => {
      const freshProfile: StudentProfile = {
        ...newProfileData,
        id: `student-${Date.now()}`,
        isDemo: false,
        onboardingCompleted: true,
      };

      const freshProgress: Record<string, StudentChapterProgress> = {};
      for (const subject of HSC_SCIENCE_SYLLABUS) {
        for (const paper of subject.papers) {
          for (const ch of paper.chapters) {
            freshProgress[ch.id] = {
              chapterId: ch.id,
              status: "not_started",
              completionPercentage: 0,
              estimatedMasteryPercentage: null,
              confidenceLevel: 30,
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

      // Generate an initial starter study plan for the new student
      const todayStr = new Date().toISOString().split("T")[0];
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

      const dailyMins = Math.round(freshProfile.dailyStudyHours * 60);
      const daysLeft = Math.max(7, getDaysRemaining(freshProfile.targetExamDate));

      const starterPlan: StudyPlan = {
        id: `plan-${Date.now()}`,
        title: `${freshProfile.targetExamName} Personal Study Schedule`,
        examName: freshProfile.targetExamName,
        examDate: freshProfile.targetExamDate,
        dailyStudyMinutes: dailyMins,
        totalAvailableMinutes: daysLeft * dailyMins,
        estimatedRequiredMinutes: 4200,
        feasibilityWarning:
          daysLeft * dailyMins < 3600
            ? "Time before exam is tight relative to full HSC Science workload. High-yield chapters have been prioritized first."
            : null,
        isActive: true,
        sourceType: "selected_chapters",
        createdAt: new Date().toISOString(),
        tasks: [
          {
            id: `task-init-1-${Date.now()}`,
            planId: `plan-${Date.now()}`,
            subjectId: "physics",
            chapterId: "phy1-ch2",
            scheduledDate: todayStr,
            title: "Learn Vector Addition, Resolution & River-Boat Basics",
            description: "Start with parallelogram law of vectors and river crossing minimum time vs shortest path.",
            taskType: "learn_basics",
            estimatedDurationMinutes: 40,
            actualDurationMinutes: 0,
            priority: "high",
            resourceSearchQuery: "HSC Physics 1st Paper Chapter 2 Vector River Boat Bangla",
            isCompleted: false,
            completedAt: null,
          },
          {
            id: `task-init-2-${Date.now()}`,
            planId: `plan-${Date.now()}`,
            subjectId: "physics",
            chapterId: "phy1-ch2",
            scheduledDate: todayStr,
            title: "Solve 15 Board MCQs on Vector Resolution & Dot/Cross Product",
            description: "Practice angle calculation and solenoidal/irrotational vector field MCQs.",
            taskType: "solve_mcq",
            estimatedDurationMinutes: 30,
            actualDurationMinutes: 0,
            priority: "high",
            resourceSearchQuery: "HSC Physics Vector MCQ Solve Bangla",
            isCompleted: false,
            completedAt: null,
          },
          {
            id: `task-init-3-${Date.now()}`,
            planId: `plan-${Date.now()}`,
            subjectId: "chemistry",
            chapterId: "chem1-ch2",
            scheduledDate: tomorrowStr,
            title: "Study Bohr Atomic Model, Quantum Numbers & Ksp Solubility Product",
            description: "Understand l, m, s quantum numbers and precipitate formation criteria (Kip > Ksp).",
            taskType: "learn_basics",
            estimatedDurationMinutes: 45,
            actualDurationMinutes: 0,
            priority: "high",
            resourceSearchQuery: "HSC Chemistry 1st Paper Chapter 2 Qualitative Chemistry Bangla",
            isCompleted: false,
            completedAt: null,
          },
        ],
      };

      setProfile(freshProfile);
      setChapterProgress(freshProgress);
      setStudyPlan(starterPlan);
      setTestAttempts([]);
      setChatMessages([
        {
          id: `msg-init-${Date.now()}`,
          role: "assistant",
          content: `Welcome to HSCBuddy, **${freshProfile.fullName}**! 🎓\n\nI have initialized your HSC ${freshProfile.hscYear} Science syllabus tracker across **${freshProfile.enrolledSubjectIds.length} subjects** with your daily target of **${freshProfile.dailyStudyHours} hours/day**.\n\nSince you haven't taken a diagnostic quiz yet, all chapters currently show **"Not assessed"** for mastery. Would you like to take a quick 5-minute diagnostic assessment or start today's study tasks?`,
          createdAt: new Date().toISOString(),
          suggestedActions: [
            {
              id: "act-init-1",
              label: "Take Diagnostic Assessment",
              actionType: "start_quiz",
              payload: { subjectId: "physics", chapterId: "phy1-ch2" },
            },
            {
              id: "act-init-2",
              label: "Explore Syllabus Universe",
              actionType: "open_syllabus",
            },
          ],
        },
      ]);
    },
    []
  );

  const updateChapterActivity = useCallback(
    (chapterId: string, activityKey: keyof ChapterActivities, completed: boolean) => {
      setChapterProgress((prev) => {
        const existing = prev[chapterId] || {
          chapterId,
          status: "not_started",
          completionPercentage: 0,
          estimatedMasteryPercentage: null,
          confidenceLevel: 40,
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

        const updatedActivities: ChapterActivities = {
          ...existing.completedActivities,
          [activityKey]: completed,
        };
        const newCompletion = calculateActivityCompletion(updatedActivities);
        const newStatus = deriveChapterStatus(
          newCompletion,
          existing.estimatedMasteryPercentage
        );

        return {
          ...prev,
          [chapterId]: {
            ...existing,
            completedActivities: updatedActivities,
            completionPercentage: newCompletion,
            status: newStatus,
            lastStudiedAt: new Date().toISOString(),
          },
        };
      });
    },
    []
  );

  const updateChapterStatusManual = useCallback(
    (chapterId: string, status: ChapterStatus) => {
      setChapterProgress((prev) => {
        const existing = prev[chapterId];
        if (!existing) return prev;

        let updatedActivities = { ...existing.completedActivities };
        let newCompletion = existing.completionPercentage;

        if (status === "not_started") {
          updatedActivities = {
            basics: false,
            formulas: false,
            tutorial: false,
            mcq: false,
            cq: false,
            quiz: false,
          };
          newCompletion = 0;
        } else if (status === "learning" && newCompletion === 0) {
          updatedActivities.basics = true;
          newCompletion = calculateActivityCompletion(updatedActivities);
        } else if (status === "practicing" && newCompletion < 50) {
          updatedActivities.basics = true;
          updatedActivities.formulas = true;
          updatedActivities.tutorial = true;
          newCompletion = calculateActivityCompletion(updatedActivities);
        } else if (status === "mastered" && newCompletion < 75) {
          updatedActivities = {
            basics: true,
            formulas: true,
            tutorial: true,
            mcq: true,
            cq: true,
            quiz: true,
          };
          newCompletion = 100;
        }

        return {
          ...prev,
          [chapterId]: {
            ...existing,
            status,
            completedActivities: updatedActivities,
            completionPercentage: newCompletion,
            lastStudiedAt: new Date().toISOString(),
          },
        };
      });
    },
    []
  );

  const updateChapterConfidence = useCallback((chapterId: string, confidence: number) => {
    setChapterProgress((prev) => {
      const existing = prev[chapterId];
      if (!existing) return prev;
      return {
        ...prev,
        [chapterId]: {
          ...existing,
          confidenceLevel: Math.max(0, Math.min(100, Math.round(confidence))),
        },
      };
    });
  }, []);

  const updateChapterEffortWeight = useCallback((chapterId: string, weight: number) => {
    setChapterProgress((prev) => {
      const existing = prev[chapterId];
      if (!existing) return prev;
      return {
        ...prev,
        [chapterId]: {
          ...existing,
          customEffortWeight: Math.max(1, Math.min(15, Math.round(weight))),
        },
      };
    });
  }, []);

  const toggleStudyTask = useCallback((taskId: string) => {
    setStudyPlan((prevPlan) => {
      if (!prevPlan) return null;
      let targetTask: StudyTask | undefined;
      const updatedTasks = prevPlan.tasks.map((t) => {
        if (t.id === taskId) {
          const nextCompleted = !t.isCompleted;
          targetTask = {
            ...t,
            isCompleted: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : null,
            actualDurationMinutes: nextCompleted ? t.estimatedDurationMinutes : 0,
          };
          return targetTask;
        }
        return t;
      });

      // Synchronize task completion with Chapter Progress activities!
      if (targetTask) {
        const taskRef = targetTask;
        const mapTaskToActivity: Record<StudyTask["taskType"], keyof ChapterActivities> = {
          learn_basics: "basics",
          review_formulas: "formulas",
          watch_tutorial: "tutorial",
          solve_mcq: "mcq",
          solve_cq: "cq",
          review_mistakes: "mcq",
          checkpoint_quiz: "quiz",
          revision: "formulas",
        };
        const actKey = mapTaskToActivity[taskRef.taskType];
        if (actKey && taskRef.isCompleted) {
          setChapterProgress((prevProg) => {
            const existing = prevProg[taskRef.chapterId];
            if (!existing) return prevProg;
            const updatedActivities = {
              ...existing.completedActivities,
              [actKey]: true,
            };
            const newCompletion = calculateActivityCompletion(updatedActivities);
            const newStatus = deriveChapterStatus(
              newCompletion,
              existing.estimatedMasteryPercentage
            );
            return {
              ...prevProg,
              [taskRef.chapterId]: {
                ...existing,
                completedActivities: updatedActivities,
                completionPercentage: newCompletion,
                status: newStatus,
                lastStudiedAt: new Date().toISOString(),
              },
            };
          });
        }
      }

      return {
        ...prevPlan,
        tasks: updatedTasks,
      };
    });
  }, []);

  const setActiveStudyPlan = useCallback(
    (newPlan: StudyPlan, preserveCompleted = true) => {
      setStudyPlan((prevPlan) => {
        if (!prevPlan || !preserveCompleted) {
          return newPlan;
        }
        const completedTasks = prevPlan.tasks.filter((t) => t.isCompleted);
        const completedKeys = new Set(
          completedTasks.map((t) => `${t.chapterId}:${t.taskType}`)
        );
        const filteredNewTasks = newPlan.tasks.filter(
          (t) => !completedKeys.has(`${t.chapterId}:${t.taskType}`)
        );
        return {
          ...newPlan,
          tasks: [...completedTasks, ...filteredNewTasks],
        };
      });
    },
    []
  );

  const rebalanceActivePlan = useCallback(
    (newDailyHours?: number, newExamDate?: string) => {
      setStudyPlan((prevPlan) => {
        if (!prevPlan) return null;
        const dailyMins = newDailyHours
          ? Math.round(newDailyHours * 60)
          : prevPlan.dailyStudyMinutes;
        const targetExamDate = newExamDate || prevPlan.examDate;
        const daysLeft = Math.max(1, getDaysRemaining(targetExamDate));

        const completedTasks = prevPlan.tasks.filter((t) => t.isCompleted);
        const incompleteTasks = prevPlan.tasks.filter((t) => !t.isCompleted);

        // Sort incomplete tasks by priority (high -> medium -> low)
        const priorityWeight = { high: 0, medium: 1, low: 2 };
        const sortedIncomplete = [...incompleteTasks].sort(
          (a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]
        );

        let dayOffset = 0;
        let currentDayMinutes = 0;

        const rescheduledIncomplete = sortedIncomplete.map((task) => {
          if (
            currentDayMinutes + task.estimatedDurationMinutes > dailyMins &&
            currentDayMinutes > 0
          ) {
            dayOffset = Math.min(daysLeft - 1, dayOffset + 1);
            currentDayMinutes = 0;
          }
          const d = new Date();
          d.setDate(d.getDate() + dayOffset);
          const dateStr = d.toISOString().split("T")[0];
          currentDayMinutes += task.estimatedDurationMinutes;
          return {
            ...task,
            scheduledDate: dateStr,
          };
        });

        const totalRequired = sortedIncomplete.reduce(
          (acc, t) => acc + t.estimatedDurationMinutes,
          0
        );
        const totalAvail = daysLeft * dailyMins;

        return {
          ...prevPlan,
          examDate: targetExamDate,
          dailyStudyMinutes: dailyMins,
          totalAvailableMinutes: totalAvail,
          estimatedRequiredMinutes: totalRequired,
          feasibilityWarning:
            totalRequired > totalAvail
              ? `Your remaining workload (${Math.round(
                  totalRequired / 60
                )}h) exceeds your available time window (${Math.round(
                  totalAvail / 60
                )}h before ${targetExamDate}). High-priority weak chapters have been front-loaded.`
              : null,
          tasks: [...completedTasks, ...rescheduledIncomplete],
        };
      });
    },
    []
  );

  const recordTestAttempt = useCallback((attempt: TestAttempt) => {
    setTestAttempts((prev) => [attempt, ...prev]);

    // Group performance by chapterId from the test attempt
    const chapterScores: Record<string, { correct: number; total: number }> = {};
    attempt.questions.forEach((q, idx) => {
      const ans = attempt.answers[idx];
      if (!chapterScores[q.chapterId]) {
        chapterScores[q.chapterId] = { correct: 0, total: 0 };
      }
      chapterScores[q.chapterId].total += 1;
      if (ans && ans.isCorrect) {
        chapterScores[q.chapterId].correct += 1;
      }
    });

    const nowIso = new Date().toISOString();

    setChapterProgress((prev) => {
      const next = { ...prev };
      Object.entries(chapterScores).forEach(([chId, stat]) => {
        const existing = next[chId];
        if (!existing) return;

        const scorePct = Math.round((stat.correct / stat.total) * 100);
        // Blend previous mastery with new assessment score if already assessed
        const newMastery =
          existing.estimatedMasteryPercentage !== null
            ? Math.round(existing.estimatedMasteryPercentage * 0.35 + scorePct * 0.65)
            : scorePct;

        const updatedActivities = {
          ...existing.completedActivities,
          quiz: true,
          mcq: stat.total >= 3 ? true : existing.completedActivities.mcq,
        };
        const newCompletion = calculateActivityCompletion(updatedActivities);
        const newStatus = deriveChapterStatus(newCompletion, newMastery);

        next[chId] = {
          ...existing,
          completedActivities: updatedActivities,
          completionPercentage: newCompletion,
          estimatedMasteryPercentage: newMastery,
          lastTestedAt: nowIso,
          lastTestScore: scorePct,
          testAttemptsCount: existing.testAttemptsCount + 1,
          status: newStatus,
        };
      });
      return next;
    });
  }, []);

  const generateTargetedRevisionPlan = useCallback(
    (weakChapterIds?: string[]): StudyPlan => {
      const targetIds =
        weakChapterIds && weakChapterIds.length > 0
          ? weakChapterIds
          : Object.values(chapterProgress)
              .filter(
                (p) =>
                  p.status === "revision_needed" ||
                  (p.estimatedMasteryPercentage !== null &&
                    p.estimatedMasteryPercentage < 60)
              )
              .map((p) => p.chapterId);

      const fallbackIds =
        targetIds.length > 0 ? targetIds : ["phy1-ch4", "chem2-ch2", "hm1-ch9"];

      const today = new Date();
      const newTasks: StudyTask[] = [];
      const planId = studyPlan?.id || `plan-rev-${Date.now()}`;

      fallbackIds.forEach((chId, index) => {
        const chMeta = getChapterById(chId);
        if (!chMeta) return;

        const d1 = new Date(today);
        d1.setDate(today.getDate() + Math.floor(index / 2));
        const dateStr1 = d1.toISOString().split("T")[0];

        const d2 = new Date(today);
        d2.setDate(today.getDate() + Math.floor(index / 2) + 1);
        const dateStr2 = d2.toISOString().split("T")[0];

        const firstTopic = chMeta.topics[0]?.titleEn || chMeta.titleEn;
        const ytQuery =
          chMeta.topics[0]?.youtubeQuery ||
          `HSC ${chMeta.subjectNameEn} ${chMeta.titleEn} Bangla`;

        newTasks.push({
          id: `rev-task-${chId}-1-${Date.now()}`,
          planId,
          subjectId: chMeta.subjectId,
          chapterId: chId,
          scheduledDate: dateStr1,
          title: `[Targeted Revision] Concept & Formula Recovery: ${chMeta.titleEn}`,
          description: `Focus on weak assessment areas in ${firstTopic} (${chMeta.titleBn}).`,
          taskType: "revision",
          estimatedDurationMinutes: 40,
          actualDurationMinutes: 0,
          priority: "high",
          resourceSearchQuery: ytQuery,
          isCompleted: false,
          completedAt: null,
        });

        newTasks.push({
          id: `rev-task-${chId}-2-${Date.now()}`,
          planId,
          subjectId: chMeta.subjectId,
          chapterId: chId,
          scheduledDate: dateStr2,
          title:
            chMeta.activityProfile === "language_writing"
              ? `[Targeted Practice] Board Passage & Writing Drills: ${chMeta.titleEn}`
              : `[Targeted Practice] Solve 15 MCQs & 2 Board CQs: ${chMeta.titleEn}`,
          description: `Rebuild accuracy above 80% in ${chMeta.titleEn} and verify with a checkpoint quiz.`,
          taskType:
            chMeta.activityProfile === "language_writing"
              ? "review_mistakes"
              : "solve_cq",
          estimatedDurationMinutes: 45,
          actualDurationMinutes: 0,
          priority: "high",
          resourceSearchQuery: ytQuery,
          isCompleted: false,
          completedAt: null,
        });
      });

      const updatedPlan: StudyPlan = studyPlan
        ? {
            ...studyPlan,
            title: `${studyPlan.title.replace(" (Adaptive Revision)", "")} (Adaptive Revision)`,
            sourceType: "diagnostic_revision",
            tasks: [
              ...studyPlan.tasks.filter((t) => t.isCompleted),
              ...newTasks,
              ...studyPlan.tasks.filter((t) => !t.isCompleted),
            ],
          }
        : {
            id: planId,
            title: "AI Targeted Weakness Recovery Plan",
            examName: profile.targetExamName,
            examDate: profile.targetExamDate,
            dailyStudyMinutes: Math.round(profile.dailyStudyHours * 60),
            totalAvailableMinutes:
              getDaysRemaining(profile.targetExamDate) *
              Math.round(profile.dailyStudyHours * 60),
            estimatedRequiredMinutes: newTasks.reduce(
              (s, t) => s + t.estimatedDurationMinutes,
              0
            ),
            feasibilityWarning: null,
            isActive: true,
            sourceType: "diagnostic_revision",
            createdAt: new Date().toISOString(),
            tasks: newTasks,
          };

      setStudyPlan(updatedPlan);
      return updatedPlan;
    },
    [chapterProgress, profile, studyPlan]
  );

  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages((prev) => [...prev, message]);
  }, []);

  const clearChatHistory = useCallback(() => {
    setChatMessages(createDemoChatHistory());
  }, []);

  const getOverallStats = useCallback((): OverallStats => {
    const allChapters = getAllChapters().filter((ch) =>
      profile.enrolledSubjectIds.includes(ch.subjectId)
    );
    let totalWeight = 0;
    let weightedCompletedSum = 0;
    let masteredChapters = 0;
    let inProgressChapters = 0;
    let revisionNeededChapters = 0;
    let notStartedChapters = 0;
    let masterySum = 0;
    let assessedChaptersCount = 0;

    for (const ch of allChapters) {
      const prog = chapterProgress[ch.id];
      const weight = prog?.customEffortWeight ?? ch.defaultEffortWeight;
      totalWeight += weight;
      const comp = prog?.completionPercentage ?? 0;
      weightedCompletedSum += comp * weight;

      const status = prog?.status ?? "not_started";
      if (status === "mastered") masteredChapters++;
      else if (status === "revision_needed") revisionNeededChapters++;
      else if (status === "learning" || status === "practicing") inProgressChapters++;
      else notStartedChapters++;

      if (
        prog?.estimatedMasteryPercentage !== null &&
        prog?.estimatedMasteryPercentage !== undefined
      ) {
        masterySum += prog.estimatedMasteryPercentage;
        assessedChaptersCount++;
      }
    }

    const tasks = studyPlan?.tasks || [];
    const completedTasks = tasks.filter((t) => t.isCompleted);
    const confirmedStudyMinutes = completedTasks.reduce(
      (sum, t) => sum + (t.actualDurationMinutes || t.estimatedDurationMinutes),
      0
    );

    return {
      totalChapters: allChapters.length,
      masteredChapters,
      inProgressChapters,
      revisionNeededChapters,
      notStartedChapters,
      weightedCompletionPercentage:
        totalWeight > 0 ? Math.round(weightedCompletedSum / totalWeight) : 0,
      averageAssessedMastery:
        assessedChaptersCount > 0 ? Math.round(masterySum / assessedChaptersCount) : null,
      assessedChaptersCount,
      confirmedStudyMinutes,
      completedTasksCount: completedTasks.length,
      totalTasksCount: tasks.length,
    };
  }, [chapterProgress, profile.enrolledSubjectIds, studyPlan]);

  const getSubjectStats = useCallback((): SubjectStat[] => {
    return HSC_SCIENCE_SYLLABUS.filter((s) =>
      profile.enrolledSubjectIds.includes(s.id)
    ).map((subject) => {
      const chapters = subject.papers.flatMap((p) => p.chapters);
      let totalWeight = 0;
      let weightedSum = 0;
      let masterySum = 0;
      let assessedCount = 0;
      let weakCount = 0;
      let masteredCount = 0;

      for (const ch of chapters) {
        const prog = chapterProgress[ch.id];
        const w = prog?.customEffortWeight ?? ch.defaultEffortWeight;
        totalWeight += w;
        weightedSum += (prog?.completionPercentage ?? 0) * w;

        if (
          prog?.estimatedMasteryPercentage !== null &&
          prog?.estimatedMasteryPercentage !== undefined
        ) {
          masterySum += prog.estimatedMasteryPercentage;
          assessedCount++;
        }
        if (prog?.status === "revision_needed") weakCount++;
        if (prog?.status === "mastered") masteredCount++;
      }

      return {
        subjectId: subject.id,
        nameEn: subject.nameEn,
        nameBn: subject.nameBn,
        accentColor: subject.accentColor,
        totalChapters: chapters.length,
        weightedCompletion: totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0,
        averageMastery: assessedCount > 0 ? Math.round(masterySum / assessedCount) : null,
        assessedCount,
        weakCount,
        masteredCount,
      };
    });
  }, [chapterProgress, profile.enrolledSubjectIds]);

  const getWeakChapters = useCallback(() => {
    const allChapters = getAllChapters().filter((ch) =>
      profile.enrolledSubjectIds.includes(ch.subjectId)
    );
    return allChapters
      .map((ch) => {
        const prog = chapterProgress[ch.id];
        return {
          chapterId: ch.id,
          titleEn: ch.titleEn,
          titleBn: ch.titleBn,
          subjectId: ch.subjectId,
          subjectNameEn: ch.subjectNameEn,
          accentColor: ch.accentColor,
          mastery: prog?.estimatedMasteryPercentage ?? null,
          completion: prog?.completionPercentage ?? 0,
          status: prog?.status ?? "not_started",
          effortWeight: prog?.customEffortWeight ?? ch.defaultEffortWeight,
        };
      })
      .filter(
        (item) =>
          item.status === "revision_needed" ||
          (item.mastery !== null && item.mastery < 60)
      )
      .sort((a, b) => (a.mastery ?? 50) - (b.mastery ?? 50));
  }, [chapterProgress, profile.enrolledSubjectIds]);

  const getTodaysTasks = useCallback((): StudyTask[] => {
    if (!studyPlan) return [];
    const todayStr = new Date().toISOString().split("T")[0];
    const todays = studyPlan.tasks.filter((t) => t.scheduledDate <= todayStr);
    if (todays.length > 0) return todays;
    return studyPlan.tasks.slice(0, 5);
  }, [studyPlan]);

  const getCompactMentorContext = useCallback(() => {
    const overall = getOverallStats();
    const weak = getWeakChapters();
    const todays = getTodaysTasks();
    const recentTests = testAttempts.slice(0, 3).map((t) => ({
      title: t.title,
      accuracyPercentage: t.accuracyPercentage,
      weakTopics: t.weakTopics,
      completedAt: t.completedAt,
    }));

    return {
      studentName: profile.fullName,
      hscYear: profile.hscYear,
      preferredLanguage: profile.preferredLanguage,
      dailyStudyHours: profile.dailyStudyHours,
      upcomingExam: {
        name: profile.targetExamName,
        date: profile.targetExamDate,
        daysRemaining: getDaysRemaining(profile.targetExamDate),
      },
      overallProgress: overall,
      weakChapters: weak.slice(0, 6),
      todaysTasks: todays.map((t) => ({
        title: t.title,
        chapterId: t.chapterId,
        durationMinutes: t.estimatedDurationMinutes,
        isCompleted: t.isCompleted,
      })),
      recentTestPerformance: recentTests,
    };
  }, [getOverallStats, getTodaysTasks, getWeakChapters, profile, testAttempts]);

  return (
    <HSCBuddyContext.Provider
      value={{
        isHydrated,
        profile,
        chapterProgress,
        studyPlan,
        testAttempts,
        chatMessages,
        updateProfile,
        resetToDemoAccount,
        initializeStudentAccount,
        updateChapterActivity,
        updateChapterStatusManual,
        updateChapterConfidence,
        updateChapterEffortWeight,
        toggleStudyTask,
        setActiveStudyPlan,
        rebalanceActivePlan,
        recordTestAttempt,
        generateTargetedRevisionPlan,
        addChatMessage,
        clearChatHistory,
        getOverallStats,
        getSubjectStats,
        getWeakChapters,
        getTodaysTasks,
        getCompactMentorContext,
      }}
    >
      {children}
    </HSCBuddyContext.Provider>
  );
}

export function useHSCBuddy() {
  const ctx = useContext(HSCBuddyContext);
  if (!ctx) {
    throw new Error("useHSCBuddy must be used inside HSCBuddyProvider");
  }
  return ctx;
}

