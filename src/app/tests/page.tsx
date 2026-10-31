"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileQuestion,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Flag,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Calendar,
  Award,
  Layers,
  BrainCircuit,
  ArrowRight,
  History,
  Play,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useHSCBuddy } from "@/lib/store";
import {
  HSC_SCIENCE_SYLLABUS,
  getChapterById,
  getSubjectById,
} from "@/data/hsc-syllabus";
import {
  MCQQuestion,
  TestAttempt,
  TestAttemptAnswer,
  TopicScoreBreakdown,
} from "@/types/hsc";
import { cn, formatShortDate } from "@/lib/utils";

function TestsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    isHydrated,
    profile,
    testAttempts,
    recordTestAttempt,
    generateTargetedRevisionPlan,
  } = useHSCBuddy();

  // Read URL params
  const modeParam = searchParams.get("mode");
  const subjectParam = searchParams.get("subject");
  const chapterParam = searchParams.get("chapter");

  // Views: "configure" | "taking" | "results" | "history"
  const [activeView, setActiveView] = useState<
    "configure" | "taking" | "results" | "history"
  >("configure");

  // Configuration state
  const [testType, setTestType] = useState<
    "diagnostic" | "subject" | "chapter" | "mixed"
  >("diagnostic");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("physics");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("phy1-ch2");
  const [questionCount, setQuestionCount] = useState<number>(6);
  const [difficulty, setDifficulty] = useState<
    "all" | "easy" | "medium" | "hard"
  >("all");
  const [timerMinutes, setTimerMinutes] = useState<number | null>(10);
  const [includeAiQuestions, setIncludeAiQuestions] = useState<boolean>(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);

  // Active exam state
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number | null>
  >({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<
    Record<string, boolean>
  >({});
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);

  // Results state
  const [currentAttemptResult, setCurrentAttemptResult] =
    useState<TestAttempt | null>(null);
  const [revisionCreatedBanner, setRevisionCreatedBanner] =
    useState<boolean>(false);

  // Sync URL params on mount
  useEffect(() => {
    if (modeParam === "diagnostic") {
      setTestType("diagnostic");
    } else if (chapterParam) {
      setTestType("chapter");
      const ch = getChapterById(chapterParam);
      if (ch) {
        setSelectedSubjectId(ch.subjectId);
        setSelectedChapterId(ch.id);
      }
    } else if (subjectParam) {
      setTestType("subject");
      setSelectedSubjectId(subjectParam);
    }
  }, [modeParam, subjectParam, chapterParam]);

  // Available subjects & chapters for dropdowns
  const enrolledSubjects = useMemo(
    () =>
      HSC_SCIENCE_SYLLABUS.filter((s) =>
        profile.enrolledSubjectIds.includes(s.id)
      ),
    [profile.enrolledSubjectIds]
  );

  const availableChaptersForSubject = useMemo(() => {
    const subj = getSubjectById(selectedSubjectId);
    if (!subj) return [];
    return subj.papers.flatMap((p) =>
      p.chapters.map((ch) => ({
        ...ch,
        paperName: p.nameEn,
      }))
    );
  }, [selectedSubjectId]);

  // Keep selectedChapterId valid when selectedSubjectId changes
  useEffect(() => {
    if (
      availableChaptersForSubject.length > 0 &&
      !availableChaptersForSubject.some((c) => c.id === selectedChapterId)
    ) {
      setSelectedChapterId(availableChaptersForSubject[0].id);
    }
  }, [availableChaptersForSubject, selectedChapterId]);

  // Exam timer effect
  useEffect(() => {
    if (activeView !== "taking") return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => {
        const next = prev + 1;
        if (timerMinutes !== null && next >= timerMinutes * 60) {
          // Time expired -> auto submit
          clearInterval(interval);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeView, timerMinutes]);

  // Auto-submit if timer reaches limit
  useEffect(() => {
    if (
      activeView === "taking" &&
      timerMinutes !== null &&
      secondsElapsed >= timerMinutes * 60 &&
      questions.length > 0
    ) {
      handleSubmitExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsElapsed, activeView, timerMinutes]);

  const handleStartExam = async () => {
    setIsLoadingQuestions(true);
    setRevisionCreatedBanner(false);
    try {
      const payload = {
        testType,
        subjectId:
          testType === "subject" || testType === "chapter"
            ? selectedSubjectId
            : undefined,
        chapterIds: testType === "chapter" ? [selectedChapterId] : undefined,
        count: questionCount,
        difficulty,
        useAiGeneration: includeAiQuestions,
      };

      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentIndex(0);
        setSelectedAnswers({});
        setFlaggedQuestions({});
        setSecondsElapsed(0);
        setShowSubmitConfirm(false);
        setActiveView("taking");
      }
    } catch (e) {
      console.error("Failed to start exam:", e);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSubmitExam = () => {
    if (questions.length === 0) return;

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const answers: TestAttemptAnswer[] = [];
    const topicMap: Record<
      string,
      {
        topic: string;
        chapterId: string;
        subjectId: string;
        questionsCount: number;
        correctCount: number;
      }
    > = {};

    const avgSecondsPerQ = Math.max(
      5,
      Math.round(secondsElapsed / Math.max(1, questions.length))
    );

    questions.forEach((q) => {
      const chosen =
        selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : null;
      const isCorrect = chosen !== null && chosen === q.correctAnswerIndex;

      if (chosen === null) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      answers.push({
        questionId: q.id,
        selectedOptionIndex: chosen,
        isCorrect,
        timeSpentSeconds: avgSecondsPerQ,
      });

      const key = `${q.chapterId}::${q.topic}`;
      if (!topicMap[key]) {
        topicMap[key] = {
          topic: q.topic,
          chapterId: q.chapterId,
          subjectId: q.subjectId,
          questionsCount: 0,
          correctCount: 0,
        };
      }
      topicMap[key].questionsCount += 1;
      if (isCorrect) {
        topicMap[key].correctCount += 1;
      }
    });

    const topicBreakdown: TopicScoreBreakdown[] = Object.values(topicMap).map(
      (item) => ({
        ...item,
        accuracyPercentage: Math.round(
          (item.correctCount / item.questionsCount) * 100
        ),
      })
    );

    const accuracyPercentage = Math.round(
      (correctCount / questions.length) * 100
    );

    const weakTopics = topicBreakdown
      .filter((t) => t.accuracyPercentage < 60)
      .map((t) => t.topic);
    const strongTopics = topicBreakdown
      .filter((t) => t.accuracyPercentage >= 75)
      .map((t) => t.topic);

    const subjMeta = getSubjectById(selectedSubjectId);
    const chMeta = getChapterById(selectedChapterId);

    const titleMap = {
      diagnostic: "AI Diagnostic Preparation Assessment",
      subject: `${subjMeta?.nameEn || "Subject"} Mock Test`,
      chapter: `${chMeta?.titleEn || "Chapter"} Checkpoint Test`,
      mixed: "HSC Science Mixed Syllabus Mock Test",
    };

    const aiSummary =
      accuracyPercentage >= 80
        ? `Strong performance (${accuracyPercentage}% accuracy)! You demonstrated solid command over ${
            strongTopics.slice(0, 2).join(", ") || "tested topics"
          }. Your chapter mastery in the Syllabus Universe has been updated.`
        : accuracyPercentage >= 55
        ? `Moderate preparation (${accuracyPercentage}% accuracy). While you scored well in ${
            strongTopics[0] || "foundational concepts"
          }, you need targeted revision and CQ/MCQ drills in ${
            weakTopics.slice(0, 2).join(", ") || "problem-solving steps"
          }.`
        : `Needs urgent attention (${accuracyPercentage}% accuracy). Key conceptual gaps were detected in ${
            weakTopics.slice(0, 3).join(", ") || "the tested chapters"
          }. We strongly recommend generating a Targeted Revision Plan to rebuild fundamentals before your exam.`;

    const attempt: TestAttempt = {
      id: `attempt-${Date.now()}`,
      title: titleMap[testType],
      testType,
      subjectId:
        testType === "subject" || testType === "chapter"
          ? selectedSubjectId
          : null,
      chapterId: testType === "chapter" ? selectedChapterId : null,
      totalQuestions: questions.length,
      correctCount,
      incorrectCount,
      unansweredCount,
      accuracyPercentage,
      timeTakenSeconds: secondsElapsed,
      timeLimitSeconds: timerMinutes ? timerMinutes * 60 : null,
      aiSummary,
      weakTopics,
      strongTopics,
      limitedEvidenceWarning: questions.length < 6,
      completedAt: new Date().toISOString(),
      questions,
      answers,
      topicBreakdown,
    };

    recordTestAttempt(attempt);
    setCurrentAttemptResult(attempt);
    setShowSubmitConfirm(false);
    setActiveView("results");
  };

  const handleGenerateTargetedRevision = () => {
    if (!currentAttemptResult) return;
    const weakChapterIds = Array.from(
      new Set(
        currentAttemptResult.topicBreakdown
          .filter((t) => t.accuracyPercentage < 65)
          .map((t) => t.chapterId)
      )
    );
    generateTargetedRevisionPlan(weakChapterIds);
    setRevisionCreatedBanner(true);
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!isHydrated) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-24 rounded-2xl bg-slate-200/70 animate-pulse" />
        <div className="h-96 rounded-2xl bg-slate-200/70 animate-pulse" />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.values(selectedAnswers).filter(
    (v) => v !== null && v !== undefined
  ).length;
  const remainingSeconds =
    timerMinutes !== null ? Math.max(0, timerMinutes * 60 - secondsElapsed) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <FileQuestion className="w-3.5 h-3.5" />
            Chorcha & Daricomma Inspired Assessment Engine
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Mock Test Center & Diagnostic Assessment
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Every test attempt updates your chapter mastery in the Syllabus Universe and adapts your study schedule.
          </p>
        </div>

        {activeView !== "taking" && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setActiveView("configure")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5",
                activeView === "configure"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              <Play className="w-3.5 h-3.5" />
              New Assessment
            </button>
            <button
              onClick={() => setActiveView("history")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5",
                activeView === "history"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              <History className="w-3.5 h-3.5" />
              Past Attempts ({testAttempts.length})
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: CONFIGURE TEST */}
      {activeView === "configure" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">
                1. Choose Assessment Mode
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Not sure how prepared you are? Choose Diagnostic Assessment to sample high-yield chapters.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: "diagnostic",
                    title: 'Diagnostic ("Assess My Prep")',
                    desc: "Samples key HSC Science chapters to pinpoint hidden weaknesses.",
                    badge: "Recommended",
                    icon: BrainCircuit,
                  },
                  {
                    id: "chapter",
                    title: "Chapter-wise Checkpoint",
                    desc: "Focus on a single chapter to verify mastery after completing tasks.",
                    badge: "Focused",
                    icon: Target,
                  },
                  {
                    id: "subject",
                    title: "Subject-wise Mock Test",
                    desc: "Test across multiple chapters of Physics, Chemistry, Math, or Biology.",
                    badge: "Subject",
                    icon: Layers,
                  },
                  {
                    id: "mixed",
                    title: "Full Syllabus Mixed Mock",
                    desc: "Combined board-style MCQ practice across all enrolled subjects.",
                    badge: "Board Style",
                    icon: Award,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = testType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setTestType(
                          item.id as
                            | "diagnostic"
                            | "subject"
                            | "chapter"
                            | "mixed"
                        )
                      }
                      className={cn(
                        "text-left p-4 rounded-xl border transition-all flex flex-col justify-between",
                        active
                          ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center",
                            active
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                            active
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject & Chapter Selectors */}
            {(testType === "subject" || testType === "chapter") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Subject
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {enrolledSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameEn} ({s.nameBn})
                      </option>
                    ))}
                  </select>
                </div>

                {testType === "chapter" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Chapter
                    </label>
                    <select
                      value={selectedChapterId}
                      onChange={(e) => setSelectedChapterId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {availableChaptersForSubject.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          Ch {ch.chapterNumber}: {ch.titleEn} ({ch.titleBn})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Question Count, Difficulty, Timer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Number of Questions
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 6, 8, 10].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={cn(
                        "py-2 rounded-lg text-xs font-bold border transition-all",
                        questionCount === cnt
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Difficulty Filter
                </label>
                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(
                      e.target.value as "all" | "easy" | "medium" | "hard"
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="all">Mixed (Board Standard)</option>
                  <option value="easy">Easy (Conceptual Basics)</option>
                  <option value="medium">Medium (Application)</option>
                  <option value="hard">Hard (Admission / Advanced)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Countdown Timer
                </label>
                <select
                  value={timerMinutes === null ? "none" : String(timerMinutes)}
                  onChange={(e) =>
                    setTimerMinutes(
                      e.target.value === "none" ? null : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="5">5 Minutes (Rapid Drill)</option>
                  <option value="10">10 Minutes (Standard)</option>
                  <option value="15">15 Minutes (Extended)</option>
                  <option value="none">Untimed Practice</option>
                </select>
              </div>
            </div>

            {/* AI Question Supplement Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Hybrid Verified Bank + Gemini AI Question Generation
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Prioritizes verified NCTB board questions and supplements with schema-validated AI MCQs when needed.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeAiQuestions}
                onChange={(e) => setIncludeAiQuestions(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={handleStartExam}
              disabled={isLoadingQuestions}
              className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-indigo-500/15 transition-all flex items-center justify-center gap-2"
            >
              {isLoadingQuestions ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Preparing Validated HSC Assessment...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Start {testType === "diagnostic" ? "Diagnostic Assessment" : "Mock Test"} Now
                </>
              )}
            </button>
          </div>

          {/* Right Sidebar: How Adaptive Mastery Works */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Honest Mastery Engine
              </div>
              <h3 className="text-base font-bold">
                How Tests Affect Your Profile
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                In HSCBuddy, checking off study tasks increases your{" "}
                <strong className="text-white">Completion %</strong>, but only mock tests prove{" "}
                <strong className="text-emerald-400">Demonstrated Mastery %</strong>.
              </p>
              <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span className="text-slate-300">
                    <strong className="text-white">≥ 75% Score:</strong> Promotes chapter toward{" "}
                    <span className="text-emerald-400 font-semibold">Mastered</span> in the Syllabus Universe.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span className="text-slate-300">
                    <strong className="text-white">&lt; 55% Score:</strong> Flags chapter as{" "}
                    <span className="text-rose-400 font-semibold">Needs Attention</span> and unlocks 1-click Targeted Revision.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="text-slate-300">
                    <strong className="text-white">AI Mentor Sync:</strong> Your AI Mentor immediately sees your weak topics to explain mistakes in Bangla or English.
                  </span>
                </div>
              </div>
            </div>

            {/* Scope Notice for CQ */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4">
              <div className="text-xs font-bold text-amber-900 mb-1">
                Assessment Scope Note
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Live automated grading evaluates 4-option Board & Admission MCQs with instant step-by-step explanations. Creative Questions (CQ / সৃজনশীল) are scheduled as structured practice tasks in the AI Study Planner.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: TAKING LIVE EXAM */}
      {activeView === "taking" && currentQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-6">
            {/* Top Bar inside Question Card */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                    {currentQuestion.topic}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      currentQuestion.difficulty === "hard"
                        ? "bg-rose-50 text-rose-700"
                        : currentQuestion.difficulty === "medium"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    )}
                  >
                    {currentQuestion.difficulty}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {remainingSeconds !== null ? (
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold",
                        remainingSeconds < 60
                          ? "bg-rose-100 text-rose-700 animate-pulse"
                          : "bg-slate-100 text-slate-800"
                      )}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {formatTimer(remainingSeconds)}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Elapsed: {formatTimer(secondsElapsed)}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleFlag(currentQuestion.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5",
                      flaggedQuestions[currentQuestion.id]
                        ? "bg-amber-50 border-amber-300 text-amber-800"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    {flaggedQuestions[currentQuestion.id] ? "Flagged" : "Flag"}
                  </button>
                </div>
              </div>

              {/* Question Stem */}
              <div className="py-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                  {currentQuestion.questionText}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected =
                    selectedAnswers[currentQuestion.id] === idx;
                  const optionLabels = ["A", "B", "C", "D"];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        handleSelectOption(currentQuestion.id, idx)
                      }
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3.5",
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                      )}
                    >
                      <span
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-700"
                        )}
                      >
                        {optionLabels[idx]}
                      </span>
                      <span className="text-sm font-medium text-slate-800">
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Navigation Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentIndex((i) =>
                        Math.min(questions.length - 1, i + 1)
                      )
                    }
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    Next Question
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirm(true)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Assessment
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Question Palette */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Question Palette
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {answeredCount} of {questions.length} answered
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all"
                  style={{
                    width: `${Math.round(
                      (answeredCount / Math.max(1, questions.length)) * 100
                    )}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-5 gap-2 pt-2">
                {questions.map((q, idx) => {
                  const isAnswered =
                    selectedAnswers[q.id] !== undefined &&
                    selectedAnswers[q.id] !== null;
                  const isFlagged = flaggedQuestions[q.id];
                  const isCurrent = idx === currentIndex;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={cn(
                        "h-9 rounded-lg text-xs font-bold border transition-all relative",
                        isCurrent
                          ? "ring-2 ring-indigo-600 border-indigo-600"
                          : "",
                        isAnswered
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                Finish & Submit ({answeredCount}/{questions.length})
              </button>
            </div>
          </div>

          {/* Submit Confirmation Modal */}
          {showSubmitConfirm && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Submit Your Assessment?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You have answered{" "}
                  <strong className="text-slate-900">{answeredCount}</strong> out of{" "}
                  <strong className="text-slate-900">{questions.length}</strong>{" "}
                  questions. Submitting will immediately grade your responses and update your Syllabus Universe mastery.
                </p>
                {answeredCount < questions.length && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      You still have {questions.length - answeredCount} unanswered{" "}
                      {questions.length - answeredCount === 1
                        ? "question"
                        : "questions"}
                      .
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirm(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Return to Questions
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitExam}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    Confirm & Grade Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: ASSESSMENT REPORT & ADAPTIVE SYNC */}
      {activeView === "results" && currentAttemptResult && (
        <div className="space-y-6">
          {/* Score Hero Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Syllabus Universe Mastery Updated
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {currentAttemptResult.title} — Diagnostic Report
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {currentAttemptResult.aiSummary}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-center px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-2xl font-black text-indigo-600">
                    {currentAttemptResult.accuracyPercentage}%
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Accuracy ({currentAttemptResult.correctCount}/
                    {currentAttemptResult.totalQuestions})
                  </div>
                </div>
                <div className="text-center px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-2xl font-black text-slate-900">
                    {formatTimer(currentAttemptResult.timeTakenSeconds)}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Time Taken
                  </div>
                </div>
              </div>
            </div>

            {/* Limited Evidence Warning if < 6 questions */}
            {currentAttemptResult.limitedEvidenceWarning && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Limited Assessment Sample Warning:</strong> Because this test had fewer than 6 questions, chapter mastery estimates have been updated conservatively. Take a 8–10 question test for higher-confidence mastery scoring.
                </div>
              </div>
            )}

            {/* Adaptive Action Bar */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleGenerateTargetedRevision}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Inject Targeted Revision Tasks into Study Plan
                </button>
                <Link
                  href="/syllabus"
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  View Updated Syllabus Universe
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/mentor?q=${encodeURIComponent(
                    `I just scored ${currentAttemptResult.accuracyPercentage}% on ${currentAttemptResult.title}. Weak topics: ${
                      currentAttemptResult.weakTopics.join(", ") || "none"
                    }. How should I revise?`
                  )}`}
                  className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-all"
                >
                  Discuss Mistakes with AI Mentor
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setActiveView("configure")}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Take Another Test
              </button>
            </div>

            {revisionCreatedBanner && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Adaptive Revision Tasks Added!</strong> High-priority concept recovery & CQ/MCQ practice tasks have been scheduled into your active study plan.
                  </span>
                </div>
                <Link
                  href="/planner"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shrink-0 hover:bg-emerald-700"
                >
                  Open Study Planner →
                </Link>
              </div>
            )}
          </div>

          {/* Topic Breakdown Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Topic & Chapter Performance Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentAttemptResult.topicBreakdown.map((tb, i) => {
                const ch = getChapterById(tb.chapterId);
                return (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {tb.topic}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ch ? `${ch.titleEn} (${ch.titleBn})` : tb.chapterId}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-bold",
                          tb.accuracyPercentage >= 75
                            ? "bg-emerald-100 text-emerald-800"
                            : tb.accuracyPercentage >= 50
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        )}
                      >
                        {tb.correctCount}/{tb.questionsCount} (
                        {tb.accuracyPercentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          tb.accuracyPercentage >= 75
                            ? "bg-emerald-500"
                            : tb.accuracyPercentage >= 50
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        )}
                        style={{ width: `${tb.accuracyPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Question-by-Question Review */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Step-by-Step Answer Review & Explanations
            </h3>
            <div className="space-y-4">
              {currentAttemptResult.questions.map((q, idx) => {
                const ans = currentAttemptResult.answers[idx];
                const chosen = ans?.selectedOptionIndex ?? null;
                const isCorrect = ans?.isCorrect ?? false;
                return (
                  <div
                    key={q.id}
                    className={cn(
                      "p-5 rounded-xl border space-y-3",
                      isCorrect
                        ? "border-emerald-200 bg-emerald-50/20"
                        : "border-rose-200 bg-rose-50/20"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                        <span className="text-xs font-bold text-slate-900">
                          Question {idx + 1} • {q.topic}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {q.provenance === "verified_bank"
                          ? "Verified NCTB Question Bank"
                          : "AI Validated MCQ"}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900">
                      {q.questionText}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => {
                        const isRightOpt = oIdx === q.correctAnswerIndex;
                        const isUserChosen = oIdx === chosen;
                        return (
                          <div
                            key={oIdx}
                            className={cn(
                              "px-3.5 py-2.5 rounded-lg text-xs font-medium border flex items-center justify-between",
                              isRightOpt
                                ? "bg-emerald-100/80 border-emerald-400 text-emerald-950 font-bold"
                                : isUserChosen && !isRightOpt
                                ? "bg-rose-100/80 border-rose-400 text-rose-950"
                                : "bg-white border-slate-200 text-slate-700"
                            )}
                          >
                            <span>
                              {["A", "B", "C", "D"][oIdx]}. {opt}
                            </span>
                            {isRightOpt && (
                              <span className="text-[10px] font-bold text-emerald-700">
                                Correct Answer
                              </span>
                            )}
                            {isUserChosen && !isRightOpt && (
                              <span className="text-[10px] font-bold text-rose-700">
                                Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3.5 rounded-lg bg-white border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                      <strong className="text-slate-900">Explanation: </strong>
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: PAST ATTEMPTS HISTORY */}
      {activeView === "history" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Completed Assessment History ({testAttempts.length})
          </h2>
          {testAttempts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <FileQuestion className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-800">
                No Mock Tests Completed Yet
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Take your first Diagnostic Assessment to replace &quot;Not assessed&quot; chapters with real mastery scores.
              </p>
              <button
                type="button"
                onClick={() => setActiveView("configure")}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                Configure First Test
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {testAttempts.map((att) => (
                <div
                  key={att.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {att.title}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[11px] font-bold",
                          att.accuracyPercentage >= 75
                            ? "bg-emerald-100 text-emerald-800"
                            : att.accuracyPercentage >= 50
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        )}
                      >
                        {att.accuracyPercentage}% ({att.correctCount}/
                        {att.totalQuestions})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {att.aiSummary}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatShortDate(att.completedAt)}
                      </span>
                      {att.weakTopics.length > 0 && (
                        <span className="text-rose-600 font-medium">
                          Weak: {att.weakTopics.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentAttemptResult(att);
                      setActiveView("results");
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-xs font-semibold text-slate-700 shrink-0 self-start sm:self-center"
                  >
                    Inspect Report →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TestsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 max-w-6xl mx-auto">
          <div className="h-96 rounded-2xl bg-slate-200/70 animate-pulse" />
        </div>
      }
    >
      <TestsContent />
    </Suspense>
  );
}

