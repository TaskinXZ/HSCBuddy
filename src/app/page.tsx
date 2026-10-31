"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Sparkles,
  Network,
  CalendarCheck2,
  ClipboardCheck,
  Youtube,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useHSCBuddy } from "@/lib/store";
import { HSC_SCIENCE_SYLLABUS } from "@/data/hsc-syllabus";

export default function LandingPage() {
  const router = useRouter();
  const { resetToDemoAccount } = useHSCBuddy();
  const [previewSubjectId, setPreviewSubjectId] = useState("physics");

  const activeSubject =
    HSC_SCIENCE_SYLLABUS.find((s) => s.id === previewSubjectId) ||
    HSC_SCIENCE_SYLLABUS[0];

  const handleLaunchDemo = () => {
    resetToDemoAccount();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight text-slate-900">
                HSCBuddy
              </span>
              <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                Bangladesh HSC Science
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/syllabus" className="hover:text-indigo-600 transition-colors">
              Syllabus Universe
            </Link>
            <Link href="/planner" className="hover:text-indigo-600 transition-colors">
              AI Study Planner
            </Link>
            <Link href="/tests" className="hover:text-indigo-600 transition-colors">
              Mock Test Center
            </Link>
            <Link href="/mentor" className="hover:text-indigo-600 transition-colors">
              AI Study Mentor
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/onboarding"
              className="hidden sm:inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              Student Setup
            </Link>
            <button
              onClick={handleLaunchDemo}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all"
            >
              <span>Open Live Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-24 border-b border-slate-200/80 bg-gradient-to-b from-white via-[#F8FAFC] to-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI-Powered Study Mentor for Bangladesh HSC Class XI & XII</span>
              </div>

              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[54px] tracking-tight text-slate-900 leading-[1.1]">
                Your syllabus.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">
                  Your progress.
                </span>{" "}
                Your AI study mentor.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Stop guessing how much of the HSC Science syllabus is left.{" "}
                <strong className="text-slate-900 font-semibold">HSCBuddy</strong>{" "}
                visualizes the true effort weight of every chapter, runs diagnostic mock
                tests, identifies your weak topics, and builds realistic daily study
                plans with Bangla YouTube lectures.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  onClick={handleLaunchDemo}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
                >
                  <Zap className="w-4 h-4" />
                  <span>Launch Hackathon Demo Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-xs transition-all"
                >
                  <span>Start Fresh Onboarding</span>
                </Link>
              </div>

              {/* Synchronized Learning Loop Pills */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "1. Syllabus Universe", sub: "Feel chapter weight" },
                  { label: "2. Diagnostic Test", sub: "Pinpoint weak topics" },
                  { label: "3. AI Study Plan", sub: "Basics → MCQ → CQ" },
                  { label: "4. Gemini Mentor", sub: "Bangla & English help" },
                ].map((step) => (
                  <div
                    key={step.label}
                    className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs"
                  >
                    <p className="text-xs font-bold text-slate-900">{step.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{step.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Interactive Syllabus Universe Mini-Preview */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-slate-900 text-white p-5 sm:p-6 shadow-xl border border-slate-800">
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      Interactive Preview
                    </span>
                    <h3 className="font-display font-bold text-base text-white">
                      HSC Science Syllabus Weight Universe
                    </h3>
                  </div>
                  <Link
                    href="/syllabus"
                    className="text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-1"
                  >
                    <span>Full View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Subject Selector Tabs */}
                <div className="flex flex-wrap gap-1.5 my-4">
                  {HSC_SCIENCE_SYLLABUS.slice(0, 5).map((subj) => (
                    <button
                      key={subj.id}
                      onClick={() => setPreviewSubjectId(subj.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        previewSubjectId === subj.id
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {subj.nameEn}
                    </button>
                  ))}
                </div>

                {/* Proportional Chapter Blocks Preview */}
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {activeSubject.papers
                    .flatMap((p) => p.chapters)
                    .slice(0, 6)
                    .map((ch, idx) => {
                      const statuses = [
                        {
                          label: "Mastered (88%)",
                          color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
                          bar: "bg-emerald-500",
                          pct: 88,
                        },
                        {
                          label: "Needs Revision (42%)",
                          color: "bg-red-500/20 border-red-500/40 text-red-300",
                          bar: "bg-red-500",
                          pct: 42,
                        },
                        {
                          label: "Practicing (70%)",
                          color: "bg-indigo-500/20 border-indigo-500/40 text-indigo-300",
                          bar: "bg-indigo-500",
                          pct: 70,
                        },
                        {
                          label: "In Progress",
                          color: "bg-amber-500/20 border-amber-500/40 text-amber-300",
                          bar: "bg-amber-500",
                          pct: 45,
                        },
                      ];
                      const st = statuses[idx % statuses.length];
                      return (
                        <div
                          key={ch.id}
                          className={`p-3 rounded-xl border ${st.color} transition-all`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-white">
                                Ch {ch.chapterNumber}: {ch.titleEn}
                              </span>
                              <span className="ml-2 text-[11px] text-slate-300">
                                ({ch.titleBn})
                              </span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/60 text-slate-200">
                              Weight: {ch.defaultEffortWeight}/15
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span>{st.label}</span>
                            <span className="font-mono">~{ch.estimatedHours}h workload</span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Click any chapter in the app to update checkpoints</span>
                  <button
                    onClick={handleLaunchDemo}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    Try Interactive Demo →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Matrix */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">
            One Connected Learning Profile — Not Disconnected Tools
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Every mock test updates your chapter mastery. Mastery shifts your study
            priorities. Completed checkpoints update your Syllabus Universe.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Network,
              title: "1. Syllabus Universe & Checkpoints",
              desc: "Explore Physics, Chemistry, Higher Math, Biology, ICT, English & Bangla in a developer-roadmap style checkpoint graph or effort-weighted treemap.",
              href: "/syllabus",
              badge: "Visual Weight",
            },
            {
              icon: CalendarCheck2,
              title: "2. AI Study Planner + Syllabus Upload",
              desc: "Upload a syllabus image/PDF or select chapters. Gemini extracts topics for your confirmation and schedules daily Basics, MCQ, CQ, and Quiz checkpoints.",
              href: "/planner",
              badge: "Multimodal Extraction",
            },
            {
              icon: ClipboardCheck,
              title: "3. Chorcha-Style Mock Test & Diagnostics",
              desc: "Not sure if you are prepared? Take a timed diagnostic or chapter mock test. Automatically pinpoints weak topics and updates syllabus mastery.",
              href: "/tests",
              badge: "Auto-Sync Mastery",
            },
            {
              icon: Sparkles,
              title: "4. Contextual Gemini Study Mentor",
              desc: "Ask questions in Bangla or English. Your AI mentor knows your exam date, weak chapters, and today's incomplete study tasks.",
              href: "/mentor",
              badge: "Bangla & English",
            },
            {
              icon: Youtube,
              title: "5. Topic-Matched YouTube Tutorials",
              desc: "Every study task and chapter links directly to curated Bangla HSC video tutorials or verified topic search queries so you can start learning in one click.",
              href: "/planner",
              badge: "1-Click Video",
            },
            {
              icon: ShieldCheck,
              title: "6. Evidence-Based Mastery Tracking",
              desc: "HSCBuddy separates self-reported task completion from test-derived mastery—never falsely claiming 100% mastery without assessment evidence.",
              href: "/analytics",
              badge: "Honest Analytics",
            },
          ].map((feat) => {
            const Icon = feat.icon;
            return (
              <Link
                key={feat.title}
                href={feat.href}
                className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-600">
                  <span>Explore module</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

