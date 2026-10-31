"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Network,
  LayoutGrid,
  CheckCircle2,
  Circle,
  Sparkles,
  ClipboardCheck,
  Youtube,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Scale,
  Clock,
  Award,
} from "lucide-react";
import { useHSCBuddy } from "@/lib/store";
import { HSC_SCIENCE_SYLLABUS, getChapterById } from "@/data/hsc-syllabus";
import {
  ChapterActivities,
  ChapterStatus,
} from "@/types/hsc";
import {
  getStatusMeta,
  buildYouTubeSearchUrl,
} from "@/lib/utils";

function SyllabusUniverseContent() {
  const searchParams = useSearchParams();
  const initialSubject = searchParams.get("subject") || "all";
  const initialChapter = searchParams.get("chapter") || "phy1-ch4";

  const {
    profile,
    chapterProgress,
    updateChapterActivity,
    updateChapterStatusManual,
    updateChapterConfidence,
    updateChapterEffortWeight,
    getOverallStats,
  } = useHSCBuddy();

  const [viewMode, setViewMode] = useState<"roadmap" | "treemap">("roadmap");
  const [selectedSubjectFilter, setSelectedSubjectFilter] =
    useState<string>(initialSubject);
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("all");
  const [activeChapterId, setActiveChapterId] =
    useState<string>(initialChapter);

  useEffect(() => {
    const subjParam = searchParams.get("subject");
    const chParam = searchParams.get("chapter");
    if (subjParam) setSelectedSubjectFilter(subjParam);
    if (chParam) setActiveChapterId(chParam);
  }, [searchParams]);

  const stats = getOverallStats();

  const enrolledSubjects = useMemo(() => {
    return HSC_SCIENCE_SYLLABUS.filter((s) =>
      profile.enrolledSubjectIds.includes(s.id)
    );
  }, [profile.enrolledSubjectIds]);

  const visibleSubjects = useMemo(() => {
    if (selectedSubjectFilter === "all") return enrolledSubjects;
    return enrolledSubjects.filter((s) => s.id === selectedSubjectFilter);
  }, [enrolledSubjects, selectedSubjectFilter]);

  const activeChapter = useMemo(
    () => getChapterById(activeChapterId) || getChapterById("phy1-ch4")!,
    [activeChapterId]
  );

  const activeProg = chapterProgress[activeChapter.id] || {
    chapterId: activeChapter.id,
    status: "not_started" as ChapterStatus,
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

  const activeEffortWeight =
    activeProg.customEffortWeight ?? activeChapter.defaultEffortWeight;

  // Calculate total effort weight across all enrolled chapters to show proportional weight %
  const totalEnrolledEffortWeight = useMemo(() => {
    let sum = 0;
    enrolledSubjects.forEach((s) =>
      s.papers.forEach((p) =>
        p.chapters.forEach((c) => {
          sum +=
            chapterProgress[c.id]?.customEffortWeight ?? c.defaultEffortWeight;
        })
      )
    );
    return Math.max(1, sum);
  }, [enrolledSubjects, chapterProgress]);

  const activityLabels: Array<{
    key: keyof ChapterActivities;
    label: string;
    weightPct: number;
  }> =
    activeChapter.activityProfile === "language_writing"
      ? [
          { key: "basics", label: "Read Core Text / Grammar Rules", weightPct: 25 },
          { key: "formulas", label: "Review Structure & Vocabulary", weightPct: 10 },
          { key: "tutorial", label: "Watch Bangla Video Lecture", weightPct: 15 },
          { key: "mcq", label: "Solve 20 Board Grammar/Reading Drills", weightPct: 25 },
          { key: "cq", label: "Practice Directed Writing / Summary", weightPct: 15 },
          { key: "quiz", label: "Complete Timed Checkpoint Quiz", weightPct: 10 },
        ]
      : [
          { key: "basics", label: "Learn Concepts & Derivations", weightPct: 25 },
          { key: "formulas", label: "Review Formulas & Definitions", weightPct: 10 },
          { key: "tutorial", label: "Watch Topic Tutorial Video", weightPct: 15 },
          { key: "mcq", label: "Solve 20 Practice MCQs", weightPct: 25 },
          { key: "cq", label: "Solve 3 Board Creative Questions (CQ)", weightPct: 15 },
          { key: "quiz", label: "Complete Timed Checkpoint Quiz", weightPct: 10 },
        ];

  return (
    <div className="space-y-6">
      {/* Top Universe Header & Legend */}
      <div className="bg-white rounded-2xl border border-slate-200/85 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200/70">
                Signature Visualization
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                NCTB HSC Science Verified Curriculum ({profile.hscYear})
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
              HSC Science Syllabus Universe
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Every chapter&apos;s visual weight reflects its heuristic workload (
              <span className="font-mono font-semibold text-slate-800">
                1–15 Effort Weight
              </span>
              ). Click any chapter node to tick off learning checkpoints, adjust
              weight, or launch a diagnostic test.
            </p>
          </div>

          {/* View Mode Switcher (Roadmap vs Proportional Weight Treemap) */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
            <button
              onClick={() => setViewMode("roadmap")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "roadmap"
                  ? "bg-white text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Checkpoint Roadmap</span>
            </button>
            <button
              onClick={() => setViewMode("treemap")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "treemap"
                  ? "bg-white text-indigo-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Weight Treemap</span>
            </button>
          </div>
        </div>

        {/* Filter Bar + Status Color Legend */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          {/* Subject Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedSubjectFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedSubjectFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Subjects ({enrolledSubjects.length})
            </button>
            {enrolledSubjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubjectFilter(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedSubjectFilter === s.id
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s.nameEn}
              </button>
            ))}
          </div>

          {/* Semantic Status Legend & Filter */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {[
              { id: "all", label: "All States", dot: "bg-slate-800" },
              { id: "mastered", label: "Mastered", dot: "bg-emerald-500" },
              { id: "practicing", label: "Practicing", dot: "bg-indigo-500" },
              { id: "learning", label: "In Progress", dot: "bg-amber-500" },
              { id: "revision_needed", label: "Needs Attention", dot: "bg-red-500" },
              { id: "not_started", label: "Not Started", dot: "bg-slate-400" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatusFilter(st.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                  selectedStatusFilter === st.id
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                <span>{st.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split View: Left 8 Cols = Interactive Universe Canvas, Right 4 Cols = Sticky Chapter Inspector */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Visualization Canvas */}
        <div className="lg:col-span-8 space-y-6">
          {viewMode === "roadmap" ? (
            /* MODE 1: DEVELOPER-ROADMAP STYLE CHECKPOINT UNIVERSE */
            <div className="space-y-6">
              {visibleSubjects.map((subject) => {
                return (
                  <div
                    key={subject.id}
                    className="bg-white rounded-2xl border border-slate-200/85 shadow-2xs overflow-hidden"
                  >
                    {/* Subject Root Banner */}
                    <div
                      className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3"
                      style={{
                        background: `linear-gradient(90deg, ${subject.accentColor}12 0%, #FFFFFF 100%)`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3.5 h-10 rounded-full"
                          style={{ backgroundColor: subject.accentColor }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-display font-bold text-lg text-slate-900">
                              {subject.nameEn} ({subject.nameBn})
                            </h2>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              Code: {subject.code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {subject.sourceLabel} • {subject.papers.length} Paper
                            {subject.papers.length > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/tests?subject=${subject.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 transition-colors"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>Test {subject.nameEn}</span>
                      </Link>
                    </div>

                    {/* Papers & Connected Chapter Nodes */}
                    <div className="p-6 space-y-8">
                      {subject.papers.map((paper) => {
                        const filteredChapters = paper.chapters.filter((ch) => {
                          if (selectedStatusFilter === "all") return true;
                          const st =
                            chapterProgress[ch.id]?.status || "not_started";
                          return st === selectedStatusFilter;
                        });

                        if (filteredChapters.length === 0) return null;

                        return (
                          <div key={paper.id} className="space-y-4">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold">
                                {paper.nameEn}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                {paper.nameBn} • {filteredChapters.length} Chapters
                              </span>
                              <div className="flex-1 h-px bg-slate-200 ml-2" />
                            </div>

                            {/* Connected Roadmap Grid */}
                            <div className="relative pl-4 sm:pl-6 border-l-2 border-dashed border-indigo-300 space-y-4">
                              {filteredChapters.map((ch) => {
                                const prog = chapterProgress[ch.id];
                                const status = prog?.status || "not_started";
                                const meta = getStatusMeta(status);
                                const comp = prog?.completionPercentage || 0;
                                const mastery =
                                  prog?.estimatedMasteryPercentage ?? null;
                                const weight =
                                  prog?.customEffortWeight ??
                                  ch.defaultEffortWeight;
                                const isSelected = activeChapter.id === ch.id;

                                return (
                                  <div
                                    key={ch.id}
                                    onClick={() => setActiveChapterId(ch.id)}
                                    className={`relative group rounded-2xl border p-4 cursor-pointer transition-all ${
                                      isSelected
                                        ? "bg-indigo-50/40 border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm"
                                        : "bg-white hover:bg-slate-50/80 border-slate-200/90"
                                    }`}
                                  >
                                    {/* Roadmap Connector Node Dot */}
                                    <span
                                      className={`absolute -left-[25px] sm:-left-[33px] top-6 w-4 h-4 rounded-full border-2 border-white shadow-xs ${meta.dot}`}
                                    />

                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                                            Ch {ch.chapterNumber}
                                          </span>
                                          <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                                            {ch.titleEn}
                                          </h3>
                                          <span className="text-xs text-slate-500 font-medium">
                                            ({ch.titleBn})
                                          </span>
                                          {ch.isHighYield && (
                                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                              High-Yield
                                            </span>
                                          )}
                                        </div>

                                        {/* Topics List */}
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                          {ch.topics.map((t) => (
                                            <span
                                              key={t.id}
                                              className="text-[11px] text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md"
                                            >
                                              • {t.titleEn}
                                            </span>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Right Status & Weight Badges */}
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span
                                          className="text-[11px] font-mono font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-700"
                                          title="Heuristic Chapter Effort Weight (1-15)"
                                        >
                                          Weight: {weight}/15
                                        </span>
                                        <span
                                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${meta.bg} ${meta.text} ${meta.border}`}
                                        >
                                          {meta.label}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Bottom Progress & Checkpoint Strip */}
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                                      {/* Quick Activity Checkpoints */}
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        {(
                                          [
                                            { key: "basics", label: "Basics" },
                                            { key: "formulas", label: "Formulas" },
                                            { key: "tutorial", label: "Video" },
                                            { key: "mcq", label: "MCQ" },
                                            { key: "cq", label: "CQ" },
                                            { key: "quiz", label: "Quiz" },
                                          ] as Array<{
                                            key: keyof ChapterActivities;
                                            label: string;
                                          }>
                                        ).map((act) => {
                                          const done =
                                            prog?.completedActivities?.[act.key] ||
                                            false;
                                          return (
                                            <button
                                              key={act.key}
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                updateChapterActivity(
                                                  ch.id,
                                                  act.key,
                                                  !done
                                                );
                                              }}
                                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all ${
                                                done
                                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                                  : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
                                              }`}
                                            >
                                              {done ? (
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                              ) : (
                                                <Circle className="w-3 h-3 text-slate-300" />
                                              )}
                                              <span>{act.label}</span>
                                            </button>
                                          );
                                        })}
                                      </div>

                                      {/* Completion vs Assessed Mastery */}
                                      <div className="flex items-center gap-3 font-mono text-[11px]">
                                        <span className="text-slate-600">
                                          Tasks: <strong>{comp}%</strong>
                                        </span>
                                        <span
                                          className={
                                            mastery !== null
                                              ? mastery >= 75
                                                ? "text-emerald-600 font-bold"
                                                : mastery < 55
                                                ? "text-red-600 font-bold"
                                                : "text-indigo-600 font-bold"
                                              : "text-slate-400"
                                          }
                                        >
                                          Mastery:{" "}
                                          {mastery !== null
                                            ? `${mastery}%`
                                            : "Not assessed"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* MODE 2: PROPORTIONAL EFFORT-WEIGHT TREEMAP UNIVERSE */
            <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 text-white border border-slate-800 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="font-display font-bold text-lg">
                    Proportional Syllabus Weight Treemap
                  </h2>
                  <p className="text-xs text-slate-400">
                    Larger blocks represent heavier HSC chapters (e.g., Organic
                    Chemistry = 15, Differentiation = 13). Color indicates real-time
                    mastery state.
                  </p>
                </div>
                <span className="text-xs font-mono text-indigo-300 bg-indigo-950/80 px-3 py-1 rounded-lg border border-indigo-500/30">
                  Total Effort Units: {totalEnrolledEffortWeight}
                </span>
              </div>

              <div className="space-y-6">
                {visibleSubjects.map((subject) => {
                  const allSubjChapters = subject.papers.flatMap((p) => p.chapters);
                  return (
                    <div key={subject.id} className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          {subject.nameEn} ({subject.nameBn})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {allSubjChapters.length} chapters
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {allSubjChapters.map((ch) => {
                          const prog = chapterProgress[ch.id];
                          const status = prog?.status || "not_started";
                          const weight =
                            prog?.customEffortWeight ?? ch.defaultEffortWeight;
                          const mastery =
                            prog?.estimatedMasteryPercentage ?? null;
                          const comp = prog?.completionPercentage ?? 0;
                          const isSelected = activeChapter.id === ch.id;

                          const tileStyles: Record<ChapterStatus, string> = {
                            mastered:
                              "bg-emerald-500/20 border-emerald-500/60 hover:bg-emerald-500/30 text-emerald-100",
                            practicing:
                              "bg-indigo-500/25 border-indigo-400/60 hover:bg-indigo-500/35 text-indigo-100",
                            learning:
                              "bg-amber-500/20 border-amber-500/60 hover:bg-amber-500/30 text-amber-100",
                            revision_needed:
                              "bg-red-500/25 border-red-500/70 hover:bg-red-500/35 text-red-100",
                            not_started:
                              "bg-slate-800/90 border-slate-700 hover:bg-slate-800 text-slate-300",
                          };

                          return (
                            <div
                              key={ch.id}
                              onClick={() => setActiveChapterId(ch.id)}
                              style={{
                                flexGrow: weight,
                                flexBasis: `${Math.max(130, weight * 18)}px`,
                                minHeight: `${Math.max(88, weight * 8.5)}px`,
                              }}
                              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                                tileStyles[status]
                              } ${
                                isSelected
                                  ? "ring-2 ring-white scale-[1.01] shadow-lg"
                                  : ""
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-[10px] font-mono opacity-80 block">
                                    Ch {ch.chapterNumber} • W:{weight}
                                  </span>
                                  <h4 className="font-display font-bold text-xs sm:text-sm leading-snug">
                                    {ch.titleEn}
                                  </h4>
                                  <p className="text-[11px] opacity-75">
                                    {ch.titleBn}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                                <span>Done: {comp}%</span>
                                <span>
                                  {mastery !== null
                                    ? `Mastery: ${mastery}%`
                                    : "Not assessed"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Columns: Sticky Chapter Inspector & Action Drawer */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 sm:p-6 space-y-5">
            {/* Inspector Header */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  {activeChapter.paperNameEn} • Ch {activeChapter.chapterNumber}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {activeChapter.syllabusVersion}
                </span>
              </div>
              <h2 className="font-display font-bold text-xl text-slate-900">
                {activeChapter.titleEn}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {activeChapter.titleBn}
              </p>
            </div>

            {/* Dual Metrics: Task Completion vs Assessed Mastery */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] text-slate-500 block">
                  Activity Completion
                </span>
                <span className="font-display font-extrabold text-2xl text-slate-900 tabular-nums">
                  {activeProg.completionPercentage}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  From 6 study checkpoints
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] text-slate-500 block">
                  Assessed Mastery
                </span>
                {activeProg.estimatedMasteryPercentage !== null ? (
                  <>
                    <span
                      className={`font-display font-extrabold text-2xl tabular-nums ${
                        activeProg.estimatedMasteryPercentage >= 80
                          ? "text-emerald-600"
                          : activeProg.estimatedMasteryPercentage < 55
                          ? "text-red-600"
                          : "text-indigo-600"
                      }`}
                    >
                      {activeProg.estimatedMasteryPercentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {activeProg.testAttemptsCount} mock test
                      {activeProg.testAttemptsCount === 1 ? "" : "s"} taken
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-display font-bold text-sm text-slate-700 block mt-1">
                      Not assessed
                    </span>
                    <span className="text-[10px] text-amber-600 block mt-0.5">
                      Take quiz to verify mastery
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Honest Mastery Rule Notice if completion is 100% but unassessed */}
            {activeProg.completionPercentage >= 80 &&
              activeProg.estimatedMasteryPercentage === null && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    You have completed most study tasks, but this chapter is still{" "}
                    <strong>Not assessed</strong>. Take a quick chapter quiz to
                    verify mastery!
                  </span>
                </div>
              )}

            {/* Manual Status Override */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Chapter Progress State
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: "not_started", label: "Not Started" },
                    { id: "learning", label: "Learning" },
                    { id: "practicing", label: "Practicing" },
                    { id: "revision_needed", label: "Needs Revision" },
                    { id: "mastered", label: "Mastered" },
                  ] as Array<{ id: ChapterStatus; label: string }>
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() =>
                      updateChapterStatusManual(activeChapter.id, st.id)
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                      activeProg.status === st.id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Learning Checkpoints */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  Chapter Study Checkpoints
                </label>
                <span className="text-[11px] text-slate-400">
                  Updates Syllabus & Planner
                </span>
              </div>
              <div className="space-y-1.5">
                {activityLabels.map((item) => {
                  const checked =
                    activeProg.completedActivities[item.key] || false;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        updateChapterActivity(
                          activeChapter.id,
                          item.key,
                          !checked
                        )
                      }
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all ${
                        checked
                          ? "bg-emerald-50/60 border-emerald-300 text-emerald-950"
                          : "bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {checked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="text-xs font-medium truncate">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        +{item.weightPct}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editable Effort Weight & Self-Reported Confidence Sliders */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-indigo-600" />
                    Heuristic Effort Weight (Editable)
                  </span>
                  <span className="font-mono font-bold text-indigo-600">
                    {activeEffortWeight} / 15
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  value={activeEffortWeight}
                  onChange={(e) =>
                    updateChapterEffortWeight(
                      activeChapter.id,
                      Number(e.target.value)
                    )
                  }
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">
                    Self-Reported Confidence (Separate from Mastery)
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {activeProg.confidenceLevel}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={activeProg.confidenceLevel}
                  onChange={(e) =>
                    updateChapterConfidence(
                      activeChapter.id,
                      Number(e.target.value)
                    )
                  }
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>

            {/* Topic-Matched YouTube Learning Links */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Youtube className="w-4 h-4 text-red-600" />
                Topic-Matched Bangla YouTube Lectures
              </span>
              {activeChapter.topics.map((topic) => (
                <a
                  key={topic.id}
                  href={buildYouTubeSearchUrl(topic.youtubeQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2.5 rounded-xl bg-red-50/50 hover:bg-red-50 border border-red-200/70 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900 line-clamp-1">
                      {topic.titleEn}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  </div>
                  <span className="text-[10px] text-red-700 font-medium block mt-0.5">
                    YouTube Search Link: &ldquo;{topic.youtubeQuery}&rdquo;
                  </span>
                </a>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2.5">
              <Link
                href={`/tests?subject=${activeChapter.subjectId}&chapter=${activeChapter.id}`}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors"
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Assess Chapter</span>
              </Link>
              <Link
                href={`/mentor?q=${encodeURIComponent(
                  `Explain ${activeChapter.titleEn} (${activeChapter.titleBn}) in Bangla and tell me what to focus on`
                )}`}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI Mentor</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SyllabusUniversePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm text-slate-500">
          Loading HSC Science Syllabus Universe...
        </div>
      }
    >
      <SyllabusUniverseContent />
    </Suspense>
  );
}

