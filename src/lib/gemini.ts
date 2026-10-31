import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

export function getGeminiClient(overrideKey?: string) {
  const envKey = (process.env.GEMINI_API_KEY || "").trim();
  const apiKey = (
    overrideKey ||
    (envKey && envKey !== "your_gemini_api_key_here" ? envKey : "")
  ).trim();

  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

export function getGeminiModelName(): string {
  const configured = (process.env.GEMINI_MODEL || "").trim();
  if (!configured || configured === "gemini-2.0-flash" || configured === "gemini-1.5-flash") {
    return "gemini-2.5-flash";
  }
  return configured;
}

/**
 * Helper to extract JSON safely from Gemini text responses (handling optional markdown code fences)
 */
export function extractJsonFromText(raw: string): unknown {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;
  return JSON.parse(candidate);
}

// ============================================================================
// ZOD SCHEMAS FOR MACHINE-CONSUMED GEMINI OUTPUTS (Section 14)
// ============================================================================

export const ExtractedSyllabusSchema = z.object({
  items: z
    .array(
      z.object({
        subjectId: z.string(),
        subjectName: z.string(),
        paperName: z.string(),
        chapterId: z.string(),
        chapterNumber: z.number().int().min(1).max(25),
        chapterTitleEn: z.string().min(2),
        chapterTitleBn: z.string().default(""),
        topics: z.array(z.string()).min(1),
        estimatedMinutes: z.number().int().positive().max(1800),
        priority: z.enum(["high", "medium", "low"]),
      })
    )
    .min(1),
  extractionSummary: z.string(),
});

export const StudyPlanTaskSchema = z.object({
  subjectId: z.string(),
  chapterId: z.string(),
  taskType: z.enum([
    "learn_basics",
    "review_formulas",
    "watch_tutorial",
    "solve_mcq",
    "solve_cq",
    "review_mistakes",
    "checkpoint_quiz",
    "revision",
  ]),
  title: z.string().min(3),
  description: z.string().min(3),
  duration: z.number().int().positive().max(240),
  priority: z.enum(["high", "medium", "low"]),
  resourceSearchQuery: z.string().min(3),
  isCompleted: z.boolean().default(false),
});

export const GeneratedStudyPlanSchema = z.object({
  planTitle: z.string().min(3),
  examDate: z.string(),
  totalAvailableStudyMinutes: z.number().int().nonnegative(),
  estimatedRequiredStudyMinutes: z.number().int().positive(),
  feasibilityWarning: z.string().nullable(),
  dailySchedules: z
    .array(
      z.object({
        date: z.string(),
        totalPlannedMinutes: z.number().int().positive(),
        tasks: z.array(StudyPlanTaskSchema).min(1),
      })
    )
    .min(1),
});

export const GeneratedQuestionSchema = z.object({
  questions: z
    .array(
      z.object({
        subjectId: z.string(),
        chapterId: z.string(),
        topic: z.string().min(2),
        questionText: z.string().min(5),
        options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
        correctAnswerIndex: z.number().int().min(0).max(3),
        explanation: z.string().min(5),
        difficulty: z.enum(["easy", "medium", "hard"]),
        provenance: z.literal("ai_generated_validated").default("ai_generated_validated"),
      })
    )
    .min(1),
});

export const MentorResponseSchema = z.object({
  reply: z.string().min(2),
  suggestedActions: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        actionType: z.enum([
          "start_quiz",
          "open_planner",
          "review_chapter",
          "generate_revision_plan",
          "open_syllabus",
        ]),
        payload: z
          .object({
            subjectId: z.string().optional(),
            chapterId: z.string().optional(),
            topic: z.string().optional(),
          })
          .optional(),
      })
    )
    .default([]),
});

