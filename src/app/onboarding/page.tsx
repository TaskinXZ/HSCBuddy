"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  CheckCircle2,
  Sparkles,
  Clock,
  Calendar,
  BookOpen,
  ArrowRight,
  FlaskConical,
} from "lucide-react";
import { useHSCBuddy } from "@/lib/store";
import { HSC_SCIENCE_SYLLABUS } from "@/data/hsc-syllabus";

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, initializeStudentAccount, resetToDemoAccount } = useHSCBuddy();

  const [fullName, setFullName] = useState(
    profile.isDemo ? "Arif Rahman" : profile.fullName
  );
  const [collegeName, setCollegeName] = useState(
    profile.isDemo ? "Dhaka College" : profile.collegeName
  );
  const [hscYear, setHscYear] = useState<number>(profile.hscYear || 2026);
  const [preferredLanguage, setPreferredLanguage] = useState<
    "English" | "Bangla" | "Bangla & English"
  >(profile.preferredLanguage || "Bangla & English");
  const [dailyStudyHours, setDailyStudyHours] = useState<number>(
    profile.dailyStudyHours || 4.5
  );
  const [targetExamName, setTargetExamName] = useState(
    "HSC Pre-Test Examination"
  );
  const [targetExamDate, setTargetExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([
    "physics",
    "chemistry",
    "higher-math",
    "biology",
    "ict",
    "english",
    "bangla",
  ]);
  const [fourthSubjectId, setFourthSubjectId] = useState<string>("biology");

  const toggleSubject = (id: string, isCompulsory: boolean) => {
    if (isCompulsory) return; // Compulsory subjects stay selected
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    initializeStudentAccount({
      fullName: fullName.trim() || "HSC Science Student",
      collegeName: collegeName.trim() || "Bangladesh HSC College",
      hscYear,
      academicGroup: "Science",
      enrolledSubjectIds:
        selectedSubjectIds.length > 0 ? selectedSubjectIds : ["physics", "chemistry", "ict"],
      fourthSubjectId,
      preferredLanguage,
      dailyStudyHours,
      targetExamName: targetExamName.trim() || "HSC Examination",
      targetExamDate,
    });
    router.push("/dashboard");
  };

  const handleUseDemoAccount = () => {
    resetToDemoAccount();
    router.push("/dashboard");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300">
              <GraduationCap className="w-4 h-4" />
              Academic Profile Setup
            </span>
            <h1 className="font-display font-bold text-2xl sm:text-3xl">
              Personalize Your HSCBuddy Study Mentor
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Configure your HSC batch year, Science subjects, upcoming exam timeline, and
              daily study availability to initialize your Syllabus Universe.
            </p>
          </div>

          <button
            type="button"
            onClick={handleUseDemoAccount}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 text-xs font-semibold transition-all"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Load 1-Click Hackathon Demo Student</span>
          </button>
        </div>
      </div>

      {/* Onboarding Form */}
      <form
        onSubmit={handleCompleteOnboarding}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-8"
      >
        {/* Step 1: Basic Student Info */}
        <div className="space-y-4">
          <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
              1
            </span>
            <span>Student Identity & HSC Batch</span>
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Student Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Tahmid Hasan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                College Name
              </label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g., Notre Dame College"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                HSC Examination Year
              </label>
              <select
                value={hscYear}
                onChange={(e) => setHscYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={2025}>HSC 2025</option>
                <option value={2026}>HSC 2026</option>
                <option value={2027}>HSC 2027</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Science Subjects & 4th Subject */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>HSC Science Subjects & Optional (4th) Subject</span>
            </h2>
            <span className="text-xs text-slate-500">
              Group: <strong>Science (বিজ্ঞান বিভাগ)</strong>
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {HSC_SCIENCE_SYLLABUS.map((subj) => {
              const isSelected = selectedSubjectIds.includes(subj.id);
              const totalCh = subj.papers.reduce(
                (acc, p) => acc + p.chapters.length,
                0
              );
              return (
                <div
                  key={subj.id}
                  onClick={() => toggleSubject(subj.id, subj.isCompulsory)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-indigo-50/60 border-indigo-500/60 shadow-2xs"
                      : "bg-slate-50 border-slate-200 opacity-65"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {subj.nameEn}
                      </p>
                      <p className="text-xs text-slate-500">{subj.nameBn}</p>
                    </div>
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? "text-indigo-600" : "text-slate-300"
                      }`}
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {subj.papers.length} Paper{subj.papers.length > 1 ? "s" : ""} •{" "}
                      {totalCh} Chapters
                    </span>
                    {subj.isCompulsory && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 font-medium">
                        Compulsory
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Optional / 4th Subject (চতুর্থ বিষয়)
              </label>
              <select
                value={fourthSubjectId}
                onChange={(e) => setFourthSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="biology">Biology (জীববিজ্ঞান)</option>
                <option value="higher-math">Higher Mathematics (উচ্চতর গণিত)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Preferred Mentor & Explanation Language
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) =>
                  setPreferredLanguage(
                    e.target.value as "English" | "Bangla" | "Bangla & English"
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Bangla & English">
                  Bangla & English (বাংলিশ / Bilingual)
                </option>
                <option value="Bangla">Bangla (বাংলা প্রাধান্য)</option>
                <option value="English">English Version</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Upcoming Target Exam & Daily Study Hours */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
              3
            </span>
            <span>Target Exam & Daily Study Time Budget</span>
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Upcoming Exam Name
              </label>
              <input
                type="text"
                required
                value={targetExamName}
                onChange={(e) => setTargetExamName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Exam Date
              </label>
              <input
                type="date"
                required
                value={targetExamDate}
                onChange={(e) => setTargetExamDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Daily Available Study Hours
                </label>
                <span className="text-xs font-mono font-bold text-indigo-600">
                  {dailyStudyHours} hrs/day
                </span>
              </div>
              <input
                type="range"
                min={1.5}
                max={12}
                step={0.5}
                value={dailyStudyHours}
                onChange={(e) => setDailyStudyHours(Number(e.target.value))}
                className="w-full accent-indigo-600 mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1.5h (Light)</span>
                <span>5h (Balanced)</span>
                <span>12h (Intensive)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Initializing a fresh account resets progress to 0% and generates a starter
            study schedule.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleUseDemoAccount}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Keep Sample Demo Data
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Initialize My Syllabus & Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

