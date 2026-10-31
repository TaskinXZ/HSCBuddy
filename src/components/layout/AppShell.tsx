"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Network,
  CalendarCheck2,
  ClipboardCheck,
  Sparkles,
  BarChart3,
  UserCog,
  Menu,
  X,
  RotateCcw,
  Clock,
  GraduationCap,
  ChevronRight,
  AlertTriangle,
  FlaskConical,
} from "lucide-react";
import { useHSCBuddy } from "@/lib/store";
import { cn, getDaysRemaining } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    labelBn: "ড্যাশবোর্ড",
    icon: LayoutDashboard,
  },
  {
    href: "/syllabus",
    label: "Syllabus Universe",
    labelBn: "সিলেবাস ইউনিভার্স",
    icon: Network,
    badge: "Visual",
  },
  {
    href: "/planner",
    label: "AI Study Planner",
    labelBn: "স্টাডি প্ল্যানার",
    icon: CalendarCheck2,
  },
  {
    href: "/tests",
    label: "Mock Test Center",
    labelBn: "মক টেস্ট ও ডায়াগনস্টিক",
    icon: ClipboardCheck,
  },
  {
    href: "/mentor",
    label: "AI Study Mentor",
    labelBn: "এআই মেন্টর",
    icon: Sparkles,
    badge: "Gemini",
  },
  {
    href: "/analytics",
    label: "Analytics",
    labelBn: "অ্যানালিটিক্স",
    icon: BarChart3,
  },
  {
    href: "/onboarding",
    label: "Academic Setup",
    labelBn: "প্রোফাইল সেটআপ",
    icon: UserCog,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    profile,
    resetToDemoAccount,
    getOverallStats,
    getWeakChapters,
  } = useHSCBuddy();

  // Do not wrap the marketing landing page "/" in the dashboard sidebar shell
  if (pathname === "/") {
    return <>{children}</>;
  }

  const stats = getOverallStats();
  const weakChapters = getWeakChapters();
  const daysLeft = getDaysRemaining(profile.targetExamDate);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col lg:flex-row">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Left Sidebar (shadcn/taxonomy inspired) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-68 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:w-64 shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-lg tracking-tight text-slate-900">
                  HSCBuddy
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                  Science
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none">
                AI Study Mentor • BD
              </p>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Profile Summary Card */}
        <div className="p-4 border-b border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/70">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-900 truncate">
                {profile.fullName}
              </span>
              {profile.isDemo && (
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300/70">
                  Demo
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate mb-2.5">
              HSC {profile.hscYear} • {profile.enrolledSubjectIds.length} Subjects
            </p>

            {/* Mini Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-medium">Syllabus Done</span>
                <span className="font-mono font-semibold text-indigo-600 tabular-nums">
                  {stats.weightedCompletionPercentage}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.weightedCompletionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-indigo-600"
                    )}
                  />
                  <div className="truncate">
                    <span className="block leading-tight">{item.label}</span>
                    <span
                      className={cn(
                        "block text-[10px] leading-tight mt-0.5",
                        isActive ? "text-indigo-100" : "text-slate-400"
                      )}
                    >
                      {item.labelBn}
                    </span>
                  </div>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-indigo-50 text-indigo-600"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Weak Chapters Alert Box in Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          {weakChapters.length > 0 && (
            <Link
              href="/tests"
              className="block p-3 rounded-xl bg-red-50/80 hover:bg-red-50 border border-red-200/70 transition-colors"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-red-700 mb-1">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  {weakChapters.length} Weak Chapters
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-red-600/90 line-clamp-1">
                {weakChapters.map((w) => w.titleEn).join(", ")}
              </p>
            </Link>
          )}

          <button
            onClick={resetToDemoAccount}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-colors"
            title="Reset sample demo student state for hackathon walkthrough"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
            <span>Reset Hackathon Demo Data</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sample Demo Banner when in Demo Mode */}
        {profile.isDemo && (
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/20">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold text-[11px]">
                <FlaskConical className="w-3 h-3" />
                SAMPLE DEMO ACCOUNT
              </span>
              <span className="text-slate-200">
                Viewing fictional student <strong>{profile.fullName}</strong>. All changes synchronize live across Syllabus, Planner, Mock Tests, and AI Mentor.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/onboarding"
                className="text-indigo-300 hover:text-white underline underline-offset-2 font-medium"
              >
                Create Custom Student Profile →
              </Link>
            </div>
          </div>
        )}

        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-100/90 px-3 py-1.5 rounded-full border border-slate-200/70">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Next Exam:</span>
              <strong className="text-slate-900">{profile.targetExamName}</strong>
              <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-mono font-semibold tabular-nums text-[11px]">
                {daysLeft}d left
              </span>
            </div>
          </div>

          {/* Right Header Metrics & Quick CTA */}
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-4 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-500 mr-1.5">Completion:</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {stats.weightedCompletionPercentage}%
                </span>
              </div>
              <div className="h-3.5 w-px bg-slate-200" />
              <div>
                <span className="text-slate-500 mr-1.5">Assessed Mastery:</span>
                <span className="font-mono font-bold text-emerald-600 tabular-nums">
                  {stats.averageAssessedMastery !== null
                    ? `${stats.averageAssessedMastery}% (${stats.assessedChaptersCount} ch)`
                    : "Not assessed"}
                </span>
              </div>
            </div>

            <Link
              href="/tests?mode=diagnostic"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Assess Prep</span>
            </Link>

            <Link
              href="/mentor"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Mentor</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

