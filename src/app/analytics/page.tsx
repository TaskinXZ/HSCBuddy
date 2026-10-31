"use client";

import React from "react";
import Link from "next/link";
import {
  BarChart3,
  Award,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Compass,
  Play,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useHSCBuddy } from "@/lib/store";
import { getAllChapters } from "@/data/hsc-syllabus";
import { cn, formatMinutes, getStatusMeta } from "@/lib/utils";

export default function AnalyticsPage() {
  const {
    isHydrated,
    profile,
    chapterProgress,
    testAttempts,
    getOverallStats,
    getSubjectStats,
  } = useHSCBuddy();

  if (!isHydrated) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-24 rounded-2xl bg-slate-200/70 animate-pulse" />
        <div className="h-96 rounded-2xl bg-slate-200/70 animate-pulse" />
      </div>
    );
  }

  const stats = getOverallStats();
  const subjectStats = getSubjectStats();

  // Prepare BarChart data: Subject Completion % vs Assessed Mastery %
  const barData = subjectStats.map((s) => ({
    name: s.nameEn.replace("Higher Mathematics", "Higher Math"),
    "Task Completion %": s.weightedCompletion,
    "Assessed Mastery %": s.averageMastery ?? 0,
    assessedCount: s.assessedCount,
  }));

  // Prepare PieChart data: Chapter Status Distribution
  const pieData = [
    {
      name: "Mastered",
      value: stats.masteredChapters,
      color: "#10B981",
    },
    {
      name: "In Progress",
      value: stats.inProgressChapters,
      color: "#F59E0B",
    },
    {
      name: "Needs Attention",
      value: stats.revisionNeededChapters,
      color: "#EF4444",
    },
    {
      name: "Not Started",
      value: stats.notStartedChapters,
      color: "#94A3B8",
    },
  ].filter((d) => d.value > 0);

  // Assessed chapters table (comparing self-reported confidence vs demonstrated test mastery)
  const enrolledChapters = getAllChapters().filter((ch) =>
    profile.enrolledSubjectIds.includes(ch.subjectId)
  );

  const assessedChapterRows = enrolledChapters
    .map((ch) => {
      const prog = chapterProgress[ch.id];
      return {
        ...ch,
        prog,
      };
    })
    .filter(
      (item) =>
        item.prog &&
        (item.prog.estimatedMasteryPercentage !== null ||
          item.prog.completionPercentage > 0)
    )
    .sort((a, b) => {
      const mA = a.prog?.estimatedMasteryPercentage ?? 999;
      const mB = b.prog?.estimatedMasteryPercentage ?? 999;
      return mA - mB;
    });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Evidence-Based Preparation Analytics
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Progress & Mastery Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Track weighted activity completion alongside test-verified chapter mastery across your HSC Science curriculum.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/tests?mode=diagnostic"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Assess More Chapters
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Weighted Completion</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats.weightedCompletionPercentage}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Weighted by chapter effort (1–15 scale)
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Demonstrated Mastery</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {stats.averageAssessedMastery !== null
              ? `${stats.averageAssessedMastery}%`
              : "Not assessed"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {stats.assessedChaptersCount} assessed chapters ({testAttempts.length} tests)
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Needs Attention</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {stats.revisionNeededChapters} Chapters
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Scored below 55% or marked for revision
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Confirmed Study Time</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatMinutes(stats.confirmedStudyMinutes)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.completedTasksCount} of {stats.totalTasksCount} scheduled tasks done
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Subject Completion % vs. Test-Verified Mastery %
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare how much you have studied (indigo) against your actual mock test performance (emerald).
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#475569" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#475569" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar
                  dataKey="Task Completion %"
                  fill="#6366F1"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="Assessed Mastery %"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Syllabus Status Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribution across {stats.totalChapters} total chapters
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {pieData.map((d) => (
              <div
                key={d.name}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs"
              >
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  {d.name}
                </span>
                <span className="font-bold text-slate-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confidence vs Demonstrated Mastery Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Self-Reported Confidence vs. Demonstrated Test Mastery
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              HSCBuddy keeps your self-reported confidence separate from test-derived mastery so you can spot blind spots early.
            </p>
          </div>
          <Link
            href="/syllabus"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Open Syllabus Universe
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400">
                <th className="py-3 pr-4">Chapter</th>
                <th className="py-3 px-3">Subject</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Task Completion</th>
                <th className="py-3 px-3">Self Confidence</th>
                <th className="py-3 px-3">Assessed Mastery</th>
                <th className="py-3 pl-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {assessedChapterRows.slice(0, 12).map((row) => {
                const prog = row.prog!;
                const meta = getStatusMeta(prog.status);
                const mastery = prog.estimatedMasteryPercentage;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-slate-900">
                        {row.titleEn}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {row.titleBn} • Weight {prog.customEffortWeight ?? row.defaultEffortWeight}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">
                      {row.subjectNameEn}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5",
                          meta.bg,
                          meta.text
                        )}
                      >
                        <span
                          className={cn("w-1.5 h-1.5 rounded-full", meta.dot)}
                        />
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {prog.completionPercentage}%
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {prog.confidenceLevel}%
                    </td>
                    <td className="py-3.5 px-3">
                      {mastery !== null ? (
                        <span
                          className={cn(
                            "font-bold",
                            mastery >= 75
                              ? "text-emerald-600"
                              : mastery >= 55
                              ? "text-amber-600"
                              : "text-rose-600"
                          )}
                        >
                          {mastery}% ({prog.testAttemptsCount}{" "}
                          {prog.testAttemptsCount === 1 ? "test" : "tests"})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">
                          Not assessed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pl-3 text-right">
                      <Link
                        href={`/tests?subject=${row.subjectId}&chapter=${row.id}`}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] inline-flex items-center gap-1"
                      >
                        {mastery === null ? "Assess Now" : "Retest"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
