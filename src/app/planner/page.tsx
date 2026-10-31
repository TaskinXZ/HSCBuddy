"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  Upload,
  FileText,
  ListChecks,
  Sparkles,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Youtube,
  ExternalLink,
  RefreshCw,
  Trash2,
  Plus,
  Check,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useHSCBuddy } from "@/lib/store";
import {
  HSC_SCIENCE_SYLLABUS,
  getAllChapters,
  getChapterById,
} from "@/data/hsc-syllabus";
import { ExtractedSyllabusItem } from "@/types/hsc";
import {
  formatMinutes,
  getDaysRemaining,
  buildYouTubeSearchUrl,
} from "@/lib/utils";

export default function StudyPlannerPage() {
  const {
    profile,
    studyPlan,
    toggleStudyTask,
    setActiveStudyPlan,
    rebalanceActivePlan,
    getWeakChapters,
    getOverallStats,
  } = useHSCBuddy();

  const allChapters = useMemo(() => getAllChapters(), []);
  const weakChapters = getWeakChapters();
  const stats = getOverallStats();

  // Plan Generator Form State
  const [showBuilder, setShowBuilder] = useState(false);
  const [inputTab, setInputTab] = useState<
    "select_chapters" | "paste_text" | "upload_file"
  >("select_chapters");

  const [examName, setExamName] = useState(
    studyPlan?.examName || profile.targetExamName || "HSC Pre-Test Examination"
  );
  const [examDate, setExamDate] = useState(
    studyPlan?.examDate || profile.targetExamDate
  );
  const [dailyHours, setDailyHours] = useState<number>(
    studyPlan
      ? Number((studyPlan.dailyStudyMinutes / 60).toFixed(1))
      : profile.dailyStudyHours
  );
  const [preserveCompleted, setPreserveCompleted] = useState(true);

  // Selected chapters for Tab 1
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([
    "phy1-ch4",
    "phy1-ch5",
    "chem1-ch4",
    "chem2-ch2",
    "hm1-ch9",
  ]);

  // Text / File Upload State for Tabs 2 & 3
  const [rawSyllabusText, setRawSyllabusText] = useState(
    "Physics 1st Paper: Chapter 2 (Vector), Chapter 4 (Newtonian Mechanics), Chapter 5 (Work, Energy & Power)\nChemistry 2nd Paper: Chapter 2 (Organic Chemistry - SN1, SN2, Aldehyde/Ketone)\nHigher Math 1st Paper: Chapter 9 (Differentiation)"
  );
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadedFileBase64, setUploadedFileBase64] = useState<string>("");
  const [uploadedFileMime, setUploadedFileMime] = useState<string>("");

  // Extraction Review State
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState<
    ExtractedSyllabusItem[] | null
  >(null);
  const [extractionNote, setExtractionNote] = useState<string | null>(null);
  const [chapterToAddId, setChapterToAddId] = useState<string>("phy1-ch2");

  // Plan Generation State
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [plannerBanner, setPlannerBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      setErrorMessage("File size exceeds 6 MB limit. Please upload a smaller image or PDF.");
      return;
    }

    setErrorMessage(null);
    setUploadedFileName(file.name);
    setUploadedFileMime(file.type || "application/pdf");

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Part = result.includes(",") ? result.split(",")[1] : result;
      setUploadedFileBase64(base64Part);
    };
    reader.readAsDataURL(file);
  };

  // Step 1 for Text/Upload: Extract & show Review Screen
  const handleExtractSyllabusForReview = async () => {
    setErrorMessage(null);
    setIsExtracting(true);
    try {
      const res = await fetch("/api/ai/extract-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: inputTab === "paste_text" ? rawSyllabusText : "",
          fileBase64: inputTab === "upload_file" ? uploadedFileBase64 : undefined,
          fileMimeType: inputTab === "upload_file" ? uploadedFileMime : undefined,
          fileName: inputTab === "upload_file" ? uploadedFileName : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to extract syllabus");
      }
      setExtractedItems(data.items || []);
      setExtractionNote(
        data.providerWarning || data.extractionSummary || "Review extracted chapters below."
      );
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Syllabus extraction failed."
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddChapterToExtracted = () => {
    const ch = getChapterById(chapterToAddId);
    if (!ch || !extractedItems) return;
    if (extractedItems.some((i) => i.chapterId === ch.id)) return;

    setExtractedItems([
      ...extractedItems,
      {
        id: `ext-manual-${Date.now()}`,
        subjectId: ch.subjectId,
        subjectName: ch.subjectNameEn,
        paperName: ch.paperNameEn,
        chapterId: ch.id,
        chapterNumber: ch.chapterNumber,
        chapterTitleEn: ch.titleEn,
        chapterTitleBn: ch.titleBn,
        topics: ch.topics.map((t) => t.titleEn),
        estimatedMinutes: Math.round(ch.estimatedHours * 15),
        priority: ch.isHighYield ? "high" : "medium",
        selected: true,
      },
    ]);
  };

  // Generate final AI Study Plan (either from Selected Chapters or Confirmed Extracted Items)
  const handleGenerateStudyPlan = async (chapterIdsToUse: string[]) => {
    if (chapterIdsToUse.length === 0) {
      setErrorMessage("Please select at least one chapter to generate a study plan.");
      return;
    }

    setErrorMessage(null);
    setIsGeneratingPlan(true);
    try {
      const res = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examName,
          examDate,
          dailyStudyHours: dailyHours,
          selectedChapterIds: chapterIdsToUse,
          weakChapterIds: weakChapters.map((w) => w.chapterId),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not generate study schedule.");
      }

      setActiveStudyPlan(data.plan, preserveCompleted);
      setExtractedItems(null);
      setShowBuilder(false);
      setPlannerBanner(
        `Generated "${data.plan.title}" with ${data.plan.tasks.length} actionable study checkpoints!`
      );
      setTimeout(() => setPlannerBanner(null), 5000);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to generate plan."
      );
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Group active study plan tasks by date
  const groupedDays = useMemo(() => {
    if (!studyPlan) return [];
    const map = new Map<string, typeof studyPlan.tasks>();
    studyPlan.tasks.forEach((t) => {
      const existing = map.get(t.scheduledDate) || [];
      existing.push(t);
      map.set(t.scheduledDate, existing);
    });
    return Array.from(map.entries())
      .sort(([d1], [d2]) => d1.localeCompare(d2))
      .map(([date, tasks]) => ({
        date,
        tasks,
        totalMinutes: tasks.reduce(
          (sum, item) => sum + item.estimatedDurationMinutes,
          0
        ),
        completedCount: tasks.filter((item) => item.isCompleted).length,
      }));
  }, [studyPlan]);

  const daysRemaining = getDaysRemaining(
    studyPlan?.examDate || profile.targetExamDate
  );

  return (
    <div className="space-y-6">
      {/* Top Planner Header */}
      <div className="bg-white rounded-2xl border border-slate-200/85 shadow-2xs p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200/70">
              Adaptive AI Scheduler
            </span>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
              AI Study Planner & Syllabus Extractor
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Breaks every HSC chapter into actionable checkpoints (
              <strong>Learn Basics → Watch Video → Solve MCQ → Solve CQ → Quiz</strong>
              ) tailored to your exam timeline and weak topics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {studyPlan && (
              <button
                type="button"
                onClick={() => {
                  rebalanceActivePlan(dailyHours, examDate);
                  setPlannerBanner(
                    "Rebalanced remaining incomplete tasks across your upcoming days while preserving completed checkpoints!"
                  );
                  setTimeout(() => setPlannerBanner(null), 4000);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Rebalance Schedule</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowBuilder((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {showBuilder
                  ? "Close Plan Builder"
                  : "Create / Upload New Exam Plan"}
              </span>
            </button>
          </div>
        </div>

        {/* Summary Metrics Strip */}
        {studyPlan && (
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[11px] text-slate-500 block">
                Active Target Exam
              </span>
              <span className="text-sm font-bold text-slate-900">
                {studyPlan.examName}
              </span>
              <span className="text-[11px] text-indigo-600 font-mono block">
                {studyPlan.examDate} ({daysRemaining} days left)
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">
                Checkpoint Progress
              </span>
              <span className="text-sm font-bold font-mono text-slate-900">
                {stats.completedTasksCount} / {stats.totalTasksCount} tasks completed
              </span>
              <span className="text-[11px] text-emerald-600 block">
                Syncs with Syllabus Universe
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">
                Confirmed Study Time
              </span>
              <span className="text-sm font-bold font-mono text-slate-900">
                {formatMinutes(stats.confirmedStudyMinutes)}
              </span>
              <span className="text-[11px] text-slate-400 block">
                Measured from completed tasks
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">
                Daily Study Budget
              </span>
              <span className="text-sm font-bold font-mono text-slate-900">
                {formatMinutes(studyPlan.dailyStudyMinutes)} / day
              </span>
              <span className="text-[11px] text-slate-400 block">
                Remaining est:{" "}
                {formatMinutes(
                  studyPlan.tasks
                    .filter((t) => !t.isCompleted)
                    .reduce((s, t) => s + t.estimatedDurationMinutes, 0)
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Feedback / Error / Feasibility Alerts */}
      {plannerBanner && (
        <div className="p-4 rounded-2xl bg-emerald-900 text-white text-xs sm:text-sm font-medium flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{plannerBanner}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {studyPlan?.feasibilityWarning && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-900">
              Schedule Feasibility & Workload Warning
            </p>
            <p className="text-amber-800 leading-relaxed">
              {studyPlan.feasibilityWarning}
            </p>
          </div>
        </div>
      )}

      {/* Collapsible Plan Builder & Multimodal Syllabus Upload Wizard */}
      {showBuilder && (
        <div className="bg-white rounded-2xl border-2 border-indigo-500/30 shadow-md p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900">
                Create or Upload Exam Syllabus Plan
              </h2>
              <p className="text-xs text-slate-500">
                Choose chapters directly, paste your exam syllabus text, or upload a
                syllabus image/PDF for AI extraction.
              </p>
            </div>

            {/* 3 Input Method Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100">
              <button
                type="button"
                onClick={() => {
                  setInputTab("select_chapters");
                  setExtractedItems(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  inputTab === "select_chapters"
                    ? "bg-white text-indigo-600 shadow-2xs"
                    : "text-slate-600"
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>1. Select Chapters</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputTab("paste_text");
                  setExtractedItems(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  inputTab === "paste_text"
                    ? "bg-white text-indigo-600 shadow-2xs"
                    : "text-slate-600"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>2. Paste/Type Syllabus</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputTab("upload_file");
                  setExtractedItems(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  inputTab === "upload_file"
                    ? "bg-white text-indigo-600 shadow-2xs"
                    : "text-slate-600"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>3. Upload Image / PDF</span>
              </button>
            </div>
          </div>

          {/* Exam Timeline Constraints */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Exam Name
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Exam Date
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Daily Available Study Hours
                </label>
                <span className="font-mono text-xs font-bold text-indigo-600">
                  {dailyHours}h / day
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                step={0.5}
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="w-full accent-indigo-600 mt-1.5"
              />
            </div>
          </div>

          {/* Tab 1: Select Existing Chapters */}
          {inputTab === "select_chapters" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Select HSC Science Chapters ({selectedChapterIds.length} selected)
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedChapterIds(weakChapters.map((w) => w.chapterId))
                    }
                    className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold"
                  >
                    Select Weak Chapters ({weakChapters.length})
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedChapterIds(
                        allChapters.filter((c) => c.isHighYield).map((c) => c.id)
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold"
                  >
                    Select All High-Yield
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-68 overflow-y-auto p-1">
                {allChapters.map((ch) => {
                  const isChecked = selectedChapterIds.includes(ch.id);
                  return (
                    <div
                      key={ch.id}
                      onClick={() =>
                        setSelectedChapterIds((prev) =>
                          prev.includes(ch.id)
                            ? prev.filter((id) => id !== ch.id)
                            : [...prev, ch.id]
                        )
                      }
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                        isChecked
                          ? "bg-indigo-50/70 border-indigo-500 text-slate-900"
                          : "bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase text-indigo-600 block">
                          {ch.subjectNameEn} • Ch {ch.chapterNumber}
                        </span>
                        <span className="font-semibold block">{ch.titleEn}</span>
                        <span className="text-[11px] text-slate-500">
                          {ch.titleBn} • W:{ch.defaultEffortWeight}
                        </span>
                      </div>
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          isChecked ? "text-indigo-600" : "text-slate-300"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveCompleted}
                    onChange={(e) => setPreserveCompleted(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Preserve already-completed study tasks</span>
                </label>

                <button
                  type="button"
                  disabled={isGeneratingPlan}
                  onClick={() => handleGenerateStudyPlan(selectedChapterIds)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs"
                >
                  {isGeneratingPlan ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Generate Personalized Study Plan</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2 & Tab 3: Paste Text or Upload Image/PDF + Mandatory Extraction Review */}
          {(inputTab === "paste_text" || inputTab === "upload_file") && (
            <div className="space-y-5">
              {inputTab === "paste_text" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Type or Paste Exam Syllabus (Supports English & Unicode Bangla)
                  </label>
                  <textarea
                    rows={4}
                    value={rawSyllabusText}
                    onChange={(e) => setRawSyllabusText(e.target.value)}
                    placeholder="e.g., পদার্থবিজ্ঞান ১ম পত্র: ভেক্টর, নিউটনীয় বলবিদ্যা; রসায়ন ২য় পত্র: জৈব রসায়ন..."
                    className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-3 bg-slate-50/60">
                  <Upload className="w-8 h-8 text-indigo-600 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Upload College Exam Routine / Syllabus Image or PDF
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Supports PNG, JPG, WebP, or PDF up to 6 MB. Gemini extracts
                      chapters for your review before creating the plan.
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="text-xs text-slate-600 file:mr-3 file:px-3.5 file:py-2 file:rounded-xl file:border-0 file:bg-indigo-600 file:text-white file:font-semibold hover:file:bg-indigo-700"
                  />
                  {uploadedFileName && (
                    <p className="text-xs font-semibold text-emerald-700">
                      Loaded file: {uploadedFileName}
                    </p>
                  )}
                </div>
              )}

              {!extractedItems && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={isExtracting}
                    onClick={handleExtractSyllabusForReview}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                  >
                    {isExtracting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Step 1: Extract & Review Syllabus Chapters</span>
                  </button>
                </div>
              )}

              {/* MANDATORY REVIEW SCREEN FOR EXTRACTED SYLLABUS (Section 7) */}
              {extractedItems && (
                <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                        Step 2: Mandatory Human Verification
                      </span>
                      <h3 className="font-display font-bold text-base text-slate-900 mt-1">
                        Review & Confirm Extracted Syllabus Items
                      </h3>
                      <p className="text-xs text-slate-600">{extractionNote}</p>
                    </div>
                  </div>

                  {/* Extracted Items List with Edit/Delete/Priority Controls */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {extractedItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => {
                              const next = [...extractedItems];
                              next[idx] = {
                                ...item,
                                selected: e.target.checked,
                              };
                              setExtractedItems(next);
                            }}
                            className="rounded text-indigo-600"
                          />
                          <div>
                            <span className="text-[10px] font-bold uppercase text-indigo-600 block">
                              {item.subjectName} • {item.paperName} (Ch{" "}
                              {item.chapterNumber})
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {item.chapterTitleEn} ({item.chapterTitleBn})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={item.priority}
                            onChange={(e) => {
                              const next = [...extractedItems];
                              next[idx] = {
                                ...item,
                                priority: e.target.value as
                                  | "high"
                                  | "medium"
                                  | "low",
                              };
                              setExtractedItems(next);
                            }}
                            className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-slate-50"
                          >
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                          </select>

                          <button
                            type="button"
                            onClick={() =>
                              setExtractedItems(
                                extractedItems.filter((x) => x.id !== item.id)
                              )
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Remove chapter"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Missing Chapter Control */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <select
                      value={chapterToAddId}
                      onChange={(e) => setChapterToAddId(e.target.value)}
                      className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      {allChapters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.subjectNameEn} — Ch {c.chapterNumber}: {c.titleEn} (
                          {c.titleBn})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddChapterToExtracted}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Chapter</span>
                    </button>
                  </div>

                  {/* Confirm & Generate Button */}
                  <div className="pt-3 border-t border-indigo-200/70 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setExtractedItems(null)}
                      className="text-xs text-slate-600 hover:underline"
                    >
                      ← Back to Edit Input
                    </button>

                    <button
                      type="button"
                      disabled={isGeneratingPlan}
                      onClick={() =>
                        handleGenerateStudyPlan(
                          extractedItems
                            .filter((i) => i.selected)
                            .map((i) => i.chapterId)
                        )
                      }
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                    >
                      {isGeneratingPlan ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>
                        Confirm Syllabus & Generate Study Schedule (
                        {extractedItems.filter((i) => i.selected).length} ch)
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Day-by-Day Study Timeline & Task Checkpoints */}
      {!studyPlan ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <CalendarCheck2 className="w-10 h-10 text-indigo-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-slate-900">
              No Active Study Plan Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Click &ldquo;Create / Upload New Exam Plan&rdquo; above to generate a
              chapter-by-chapter HSC Science study schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowBuilder(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Study Plan Now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedDays.map((dayGroup, dayIndex) => {
            const todayStr = new Date().toISOString().split("T")[0];
            const isToday = dayGroup.date === todayStr;
            const isPast = dayGroup.date < todayStr;

            return (
              <div
                key={dayGroup.date}
                className={`bg-white rounded-2xl border shadow-2xs overflow-hidden ${
                  isToday
                    ? "border-indigo-500/70 ring-1 ring-indigo-500/20"
                    : "border-slate-200/85"
                }`}
              >
                {/* Day Header */}
                <div
                  className={`px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-2 ${
                    isToday
                      ? "bg-indigo-50/70 border-indigo-100"
                      : "bg-slate-50/70 border-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold">
                      Day {dayIndex + 1}
                    </span>
                    <span className="font-display font-bold text-sm text-slate-900">
                      {dayGroup.date}
                    </span>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase">
                        Today
                      </span>
                    )}
                    {isPast &&
                      dayGroup.completedCount < dayGroup.tasks.length && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Has Overdue Tasks
                        </span>
                      )}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
                    <span>
                      Planned: <strong>{formatMinutes(dayGroup.totalMinutes)}</strong>
                    </span>
                    <span>
                      Done:{" "}
                      <strong>
                        {dayGroup.completedCount}/{dayGroup.tasks.length}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Day Tasks Checklist */}
                <div className="divide-y divide-slate-100 px-6">
                  {dayGroup.tasks.map((task) => {
                    const chMeta = getChapterById(task.chapterId);
                    return (
                      <div
                        key={task.id}
                        className={`py-4 flex items-start gap-3.5 transition-all ${
                          task.isCompleted ? "opacity-65" : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleStudyTask(task.id)}
                          className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
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
                                className="font-semibold text-slate-700 hover:text-indigo-600"
                              >
                                {chMeta.subjectNameEn} • Ch {chMeta.chapterNumber}:{" "}
                                {chMeta.titleEn} ({chMeta.titleBn})
                              </Link>
                            )}
                            <span className="font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.estimatedDurationMinutes} mins
                            </span>
                            {task.resourceSearchQuery && (
                              <a
                                href={buildYouTubeSearchUrl(
                                  task.resourceSearchQuery
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold"
                              >
                                <Youtube className="w-3.5 h-3.5" />
                                <span>Watch YouTube Tutorial (Search)</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {task.taskType === "checkpoint_quiz" && chMeta && (
                              <Link
                                href={`/tests?subject=${chMeta.subjectId}&chapter=${chMeta.id}`}
                                className="text-indigo-600 font-semibold hover:underline"
                              >
                                Launch Checkpoint Quiz →
                              </Link>
                            )}
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
      )}
    </div>
  );
}

