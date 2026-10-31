import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChapterActivities, ChapterStatus } from "@/types/hsc";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ACTIVITY_WEIGHTS: Record<keyof ChapterActivities, number> = {
  basics: 25,
  formulas: 10,
  tutorial: 15,
  mcq: 25,
  cq: 15,
  quiz: 10,
};

export function calculateActivityCompletion(activities: ChapterActivities): number {
  let total = 0;
  (Object.keys(ACTIVITY_WEIGHTS) as Array<keyof ChapterActivities>).forEach((key) => {
    if (activities[key]) {
      total += ACTIVITY_WEIGHTS[key];
    }
  });
  return Math.min(100, Math.round(total));
}

/**
 * Derives realistic chapter status from completion & test-derived mastery.
 * Never marks a chapter as "mastered" solely from checking off tasks without assessment evidence.
 */
export function deriveChapterStatus(
  completionPercentage: number,
  estimatedMasteryPercentage: number | null
): ChapterStatus {
  if (estimatedMasteryPercentage !== null) {
    if (estimatedMasteryPercentage < 55) {
      return "revision_needed";
    }
    if (estimatedMasteryPercentage >= 80 && completionPercentage >= 60) {
      return "mastered";
    }
    if (estimatedMasteryPercentage >= 65) {
      return "practicing";
    }
  }

  if (completionPercentage === 0 && estimatedMasteryPercentage === null) {
    return "not_started";
  }
  if (completionPercentage >= 60) {
    return "practicing";
  }
  return "learning";
}

export function getStatusMeta(status: ChapterStatus) {
  switch (status) {
    case "mastered":
      return {
        label: "Mastered",
        labelBn: "আয়ত্তকৃত",
        bg: "bg-emerald-500/12",
        text: "text-emerald-700",
        border: "border-emerald-500/30",
        dot: "bg-emerald-500",
        hex: "#10B981",
      };
    case "practicing":
      return {
        label: "Practicing",
        labelBn: "অনুশীলনরত",
        bg: "bg-indigo-500/12",
        text: "text-indigo-700",
        border: "border-indigo-500/30",
        dot: "bg-indigo-500",
        hex: "#6366F1",
      };
    case "learning":
      return {
        label: "In Progress",
        labelBn: "চলমান",
        bg: "bg-amber-500/12",
        text: "text-amber-700",
        border: "border-amber-500/30",
        dot: "bg-amber-500",
        hex: "#F59E0B",
      };
    case "revision_needed":
      return {
        label: "Needs Attention",
        labelBn: "রিভিশন প্রয়োজন",
        bg: "bg-red-500/12",
        text: "text-red-700",
        border: "border-red-500/30",
        dot: "bg-red-500",
        hex: "#EF4444",
      };
    case "not_started":
    default:
      return {
        label: "Not Started",
        labelBn: "শুরু হয়নি",
        bg: "bg-slate-500/10",
        text: "text-slate-600",
        border: "border-slate-300",
        dot: "bg-slate-400",
        hex: "#94A3B8",
      };
  }
}

export function formatMinutes(mins: number): string {
  if (mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function getDaysRemaining(targetDateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function buildYouTubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function formatShortDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

