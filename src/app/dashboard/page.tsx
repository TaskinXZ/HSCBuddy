"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Sparkles,
  CalendarCheck2,
  Network,
  ClipboardCheck,
  Youtube,
  ArrowRight,
  Clock,
  Award,
  TrendingUp,
  BookOpen,
  Zap,
  ExternalLink,
} from "lucide-react";
import { useHSCBuddy } from "@/lib/store";
import {
  formatMinutes,
  getDaysRemaining,
  buildYouTubeSearchUrl,
  getStatusMeta,
} from "@/lib/utils";
import { getChapterById } from "@/data/hsc-syllabus";

export default function DashboardPage() {
  const router = useRouter();
  const {
    profile,
    studyPlan,
    testAttempts,
    toggleStudyTask,
    generateTargetedRevisionPlan,
    getOverallStats,
    getSubjectStats,
    getWeakChapters,
    getTodaysTasks,
  } = useHSCBuddy();

  const [quickPrompt, setQuickPrompt] = useState("");
  const [revisionToast, setRevisionToast] = useState<string | null>(null);

  const stats = getOverallStats();
  const subjectStats = getSubjectStats();
  const weakChapters = getWeakChapters();
  const todaysTasks = getTodaysTasks();
  const daysLeft = getDaysRemaining(profile.targetExamDate);

  const handleQuickMentorAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    router.push(`/mentor?q=${encodeURIComponent(quickPrompt.trim())}`);
  };

  const handleGenerateWeakRevision = () => {
    const plan = generateTargetedRevisionPlan(
      weakChapters.map((w) => w.chapterId)
    );
    setRevisionToast(
      `Added targeted revision tasks for ${weakChapters.length} weak chapters to "${plan.title}"!`
    );
    setTimeout(() => setRevisionToast(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {revisionToast && (
        <div className="p-4 rounded-2xl bg-emerald-900 text-white text-xs sm:text-sm font-medium flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{revisionToast}</span>
          </div>
          <Link
            href="/planner"
            className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold shrink-0"
          >
            View Schedule →
          </Link>
        </div>
      )}

      {/* Top Welcome & Mentor Quick Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 shadow-md border border-indigo-500/20">
        <div className="grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-semibold">
                HSC {profile.hscYear} • Science Group
              </span>
              <span className="text-xs text-slate-300">
                {profile.collegeName}
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
              Welcome back, {profile.fullName.split(" (")[0]} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              You have{" "}
              <strong className="text-white font-semibold">
                {todaysTasks.filter((t) => !t.isCompleted).length} pending study
                tasks
              </strong>{" "}
              for today and{" "}
              <strong className="text-amber-300 font-semibold">
                {daysLeft} days remaining
              </strong>{" "}
              until <strong>{profile.targetExamName}</strong>.
            </p>
          </div>

          {/* Quick Mentor Input */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleQuickMentorAsk}
              className="p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-indigo-300 ml-2.5 shrink-0" />
              <input
                type="text"
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                placeholder="Ask AI Mentor (e.g. 'Explain vectors in Bangla' or 'What to study today?')"
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                Ask Gemini
              </button>
            </form>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                "What should I study today?",
                "Why am I weak in Newtonian Mechanics?",
                "Explain vectors in Bangla",
              ].map((chip) => (
                <Link
                  key={chip}
                  href={`/mentor?q=${encodeURIComponent(chip)}`}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10 transition-colors"
                >
                  {chip}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core KPI Metric Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Weighted Syllabus Completion */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/85 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Weighted Syllabus Completion
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-extrabold text-3xl text-slate-900 tabular-nums">
                {stats.weightedCompletionPercentage}%
              </span>
              <span className="text-xs text-slate-500">
                of {stats.totalChapters} chapters
              </span>
            </div>
            <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${stats.weightedCompletionPercentage}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{stats.masteredChapters} Mastered</span>
            <span>{stats.inProgressChapters} Active</span>
            <Link
              href="/syllabus"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Universe →
            </Link>
          </div>
        </div>

        {/* KPI 2: Assessed Mastery (Evidence-Based) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/85 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Test-Derived Mastery
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            {stats.averageAssessedMastery !== null ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-extrabold text-3xl text-emerald-600 tabular-nums">
                    {stats.averageAssessedMastery}%
                  </span>
                  <span className="text-xs text-slate-500">
                    across {stats.assessedChaptersCount} assessed ch.
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {stats.totalChapters - stats.assessedChaptersCount} chapters
                  currently marked <strong>&ldquo;Not assessed&rdquo;</strong>
                </p>
              </>
            ) : (
              <div>
                <span className="font-display font-bold text-xl text-slate-700">
                  Not Assessed Yet
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Take a diagnostic mock test to compute verified mastery.
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">
              {testAttempts.length} test attempt{testAttempts.length === 1 ? "" : "s"}
            </span>
            <Link
              href="/tests?mode=diagnostic"
              className="text-emerald-600 font-semibold hover:underline"
            >
              Assess Prep →
            </Link>
          </div>
        </div>

        {/* KPI 3: Confirmed Study Activity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/85 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Confirmed Study Progress
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-extrabold text-3xl text-slate-900 tabular-nums">
                {stats.completedTasksCount}/{stats.totalTasksCount}
              </span>
              <span className="text-xs text-slate-500">tasks checked</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Confirmed time:{" "}
              <strong className="text-slate-800 font-mono">
                {formatMinutes(stats.confirmedStudyMinutes)}
              </strong>{" "}
              (from completed tasks only)
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">
              Budget: {profile.dailyStudyHours}h/day
            </span>
            <Link
              href="/planner"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Open Planner →
            </Link>
          </div>
        </div>

        {/* KPI 4: Weak Chapters Alert */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/85 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Weakness & Revision Radar
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-extrabold text-3xl text-red-600 tabular-nums">
                {weakChapters.length}
              </span>
              <span className="text-xs text-slate-500">
                chapters need revision
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 truncate">
              {weakChapters.length > 0
                ? `Priority: ${weakChapters
                    .slice(0, 2)
                    .map((w) => w.titleEn)
                    .join(", ")}`
                : "No high-risk weak chapters detected yet."}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <button
              onClick={handleGenerateWeakRevision}
              className="text-red-600 font-semibold hover:underline"
            >
              + Auto-Schedule Revision
            </button>
            <Link
              href="/analytics"
              className="text-slate-600 font-medium hover:underline"
            >
              Details →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid: Today's Study Tasks + Weak Areas / Subject Breakdown */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Today's Actionable Study Schedule */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/85 shadow-2xs p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Daily Checkpoint Execution
                </span>
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Today&apos;s Study Tasks & Video Resources
                </h2>
              </div>
              <Link
                href="/planner"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <span>Full Study Planner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {todaysTasks.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-sm text-slate-600">
                  No tasks scheduled for today yet.
                </p>
                <Link
                  href="/planner"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  <CalendarCheck2 className="w-4 h-4" />
                  <span>Generate AI Study Schedule</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {todaysTasks.map((task) => {
                  const chMeta = getChapterById(task.chapterId);
                  return (
                    <div
                      key={task.id}
                      className={`py-3.5 flex items-start gap-3.5 transition-all ${
                        task.isCompleted ? "opacity-65" : ""
                      }`}
                    >
                      <button
                        onClick={() => toggleStudyTask(task.id)}
                        className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                        aria-label={`Mark ${task.title} complete`}
                      >
                        {task.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              task.isCompleted
                                ? "line-through text-slate-400"
                                : "text-slate-900"
                            }`}
                          >
                            {task.title}
                          </span>
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                              task.priority === "high"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            }`}
                          >
                            {task.taskType.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {task.description}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          {chMeta && (
                            <Link
                              href={`/syllabus?subject=${chMeta.subjectId}&chapter=${chMeta.id}`}
                              className="font-medium text-slate-700 hover:text-indigo-600"
                            >
                              {chMeta.subjectNameEn} • Ch {chMeta.chapterNumber} (
                              {chMeta.titleBn})
                            </Link>
                          )}
                          <span className="font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimatedDurationMinutes}m
                          </span>
                          {task.resourceSearchQuery && (
                            <a
                              href={buildYouTubeSearchUrl(task.resourceSearchQuery)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold"
                            >
                              <Youtube className="w-3.5 h-3.5" />
                              <span>Watch Tutorial (Search)</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subject-Wise Syllabus & Mastery Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/85 shadow-2xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-display font-bold text-lg text-slate-900">
                  Enrolled HSC Science Subjects
                </h2>
                <p className="text-xs text-slate-500">
                  Click any subject to inspect papers and chapters in the Syllabus Universe
                </p>
              </div>
              <Link
                href="/syllabus"
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Explore All →
              </Link>
            </div>

            <div className="mt-4 grid sm:grid-cols-2 gap-3.5">
              {subjectStats.map((subj) => (
                <Link
                  key={subj.subjectId}
                  href={`/syllabus?subject=${subj.subjectId}`}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-indigo-400 hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {subj.nameEn}
                      </p>
                      <p className="text-xs text-slate-500">{subj.nameBn}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                      {subj.weightedCompletion}%
                    </span>
                  </div>

                  <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${subj.weightedCompletion}%`,
                        backgroundColor: subj.accentColor,
                      }}
                    />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Mastery:{" "}
                      <strong className="text-slate-700">
                        {subj.averageMastery !== null
                          ? `${subj.averageMastery}%`
                          : "Not assessed"}
                      </strong>
                    </span>
                    {subj.weakCount > 0 ? (
                      <span className="text-red-600 font-semibold">
                        {subj.weakCount} weak ch.
                      </span>
                    ) : (
                      <span>{subj.masteredCount} mastered</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Weak Chapters + Recent Assessments */}
        <div className="lg:col-span-5 space-y-6">
          {/* Weak Chapters Requiring Attention */}
          <div className="bg-white rounded-2xl border border-red-200/80 shadow-2xs p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h2 className="font-display font-bold text-base text-slate-900">
                  Chapters Needing Attention
                </h2>
              </div>
              <button
                onClick={handleGenerateWeakRevision}
                className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200"
              >
                + Build Revision Plan
              </button>
            </div>

            {weakChapters.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  No weak chapters identified yet. Take a diagnostic mock test to
                  evaluate your preparation!
                </p>
                <Link
                  href="/tests?mode=diagnostic"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Assess My Preparation</span>
                </Link>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {weakChapters.map((w) => {
                  const meta = getStatusMeta(w.status);
                  return (
                    <div
                      key={w.chapterId}
                      className="p-3.5 rounded-xl bg-red-50/40 border border-red-200/70 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                            {w.subjectNameEn} • Effort Weight {w.effortWeight}/15
                          </span>
                          <h3 className="text-sm font-bold text-slate-900">
                            {w.titleEn} ({w.titleBn})
                          </h3>
                        </div>
                        <span
                          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${meta.bg} ${meta.text}`}
                        >
                          {w.mastery !== null ? `${w.mastery}% Mastery` : "Needs Review"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          href={`/tests?subject=${w.subjectId}&chapter=${w.chapterId}`}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-[11px] font-semibold"
                        >
                          Retake Chapter Quiz
                        </Link>
                        <Link
                          href={`/mentor?q=${encodeURIComponent(
                            `Explain key concepts and formulas of ${w.titleEn} (${w.titleBn}) in Bangla`
                          )}`}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold"
                        >
                          Ask AI Mentor
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Mock Test Performance */}
          <div className="bg-white rounded-2xl border border-slate-200/85 shadow-2xs p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-display font-bold text-base text-slate-900">
                  Recent Mock & Diagnostic Tests
                </h2>
                <p className="text-xs text-slate-500">
                  Assessment evidence automatically syncs with your Syllabus Universe
                </p>
              </div>
              <Link
                href="/tests"
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Test Center →
              </Link>
            </div>

            {testAttempts.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs text-slate-500">
                  You haven&apos;t taken any mock tests yet.
                </p>
                <Link
                  href="/tests"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Take Your First Diagnostic Test</span>
                </Link>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {testAttempts.slice(0, 3).map((attempt) => (
                  <div
                    key={attempt.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {attempt.title}
                      </span>
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                          attempt.accuracyPercentage >= 75
                            ? "bg-emerald-100 text-emerald-800"
                            : attempt.accuracyPercentage >= 55
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {attempt.accuracyPercentage}% ({attempt.correctCount}/
                        {attempt.totalQuestions})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {attempt.aiSummary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

