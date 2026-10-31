import { NextRequest, NextResponse } from "next/server";
import {
  getGeminiClient,
  getGeminiModelName,
  extractJsonFromText,
  GeneratedQuestionSchema,
} from "@/lib/gemini";
import { VERIFIED_QUESTION_BANK } from "@/data/question-bank";
import { getChapterById } from "@/data/hsc-syllabus";
import { MCQQuestion } from "@/types/hsc";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      subjectId,
      chapterId,
      questionCount = 6,
      difficulty = "all",
      preferAiGeneration = false,
      customApiKey,
    }: {
      subjectId?: string;
      chapterId?: string;
      questionCount?: number;
      difficulty?: "all" | "easy" | "medium" | "hard";
      preferAiGeneration?: boolean;
      customApiKey?: string;
    } = body;

    const count = Math.max(3, Math.min(20, questionCount));

    // Filter verified question bank first
    let bankPool = [...VERIFIED_QUESTION_BANK];
    if (chapterId && chapterId !== "all") {
      const chMatches = bankPool.filter((q) => q.chapterId === chapterId);
      if (chMatches.length > 0) bankPool = chMatches;
    } else if (subjectId && subjectId !== "all") {
      const subjMatches = bankPool.filter((q) => q.subjectId === subjectId);
      if (subjMatches.length > 0) bankPool = subjMatches;
    }

    if (difficulty && difficulty !== "all") {
      const diffMatches = bankPool.filter((q) => q.difficulty === difficulty);
      if (diffMatches.length >= 2) bankPool = diffMatches;
    }

    const genAI = getGeminiClient(customApiKey);
    const chapterMeta =
      chapterId && chapterId !== "all" ? getChapterById(chapterId) : undefined;

    if (genAI && (preferAiGeneration || bankPool.length < count)) {
      try {
        const model = genAI.getGenerativeModel({
          model: getGeminiModelName(),
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        });

        const neededCount = preferAiGeneration
          ? count
          : Math.max(2, count - bankPool.length);

        const prompt = `Generate ${neededCount} verified, mathematically/scientifically accurate Bangladesh NCTB HSC Science Multiple Choice Questions (MCQs).
Target Subject ID: ${subjectId || "physics"}
Target Chapter: ${
          chapterMeta
            ? `${chapterMeta.titleEn} (${chapterMeta.titleBn}) [id: ${chapterMeta.id}]`
            : "Mixed HSC Science High-Yield Chapters"
        }
Difficulty: ${difficulty === "all" ? "medium" : difficulty}

Return ONLY valid JSON matching:
{
  "questions": [
    {
      "subjectId": "${chapterMeta?.subjectId || subjectId || "physics"}",
      "chapterId": "${chapterMeta?.id || chapterId || "phy1-ch4"}",
      "topic": "string",
      "questionText": "string",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Step-by-step academic explanation",
      "difficulty": "easy | medium | hard",
      "provenance": "ai_generated_validated"
    }
  ]
}`;

        const result = await model.generateContent(prompt);
        const parsed = extractJsonFromText(result.response.text());
        const validated = GeneratedQuestionSchema.parse(parsed);

        const aiQuestions: MCQQuestion[] = validated.questions.map((q, idx) => ({
          id: `q-ai-${Date.now()}-${idx}`,
          subjectId: q.subjectId,
          chapterId: q.chapterId,
          topic: q.topic,
          questionText: q.questionText,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex as 0 | 1 | 2 | 3,
          explanation: q.explanation,
          difficulty: q.difficulty,
          provenance: "ai_generated_validated",
        }));

        const combined = preferAiGeneration
          ? [...aiQuestions, ...bankPool].slice(0, count)
          : [...bankPool, ...aiQuestions].slice(0, count);

        return NextResponse.json({
          mode: "live_gemini_plus_verified_bank",
          questions: combined,
        });
      } catch (geminiErr) {
        console.warn("Gemini MCQ generation fallback to verified question bank:", geminiErr);
      }
    }

    // Return deterministic verified questions from bank (supplementing from broader subject/all bank if needed)
    const selectedIds = new Set(bankPool.map((q) => q.id));
    if (bankPool.length < count) {
      const subjectFallback = VERIFIED_QUESTION_BANK.filter(
        (q) =>
          (!subjectId || subjectId === "all" || q.subjectId === subjectId) &&
          !selectedIds.has(q.id)
      );
      bankPool.push(...subjectFallback);
    }
    if (bankPool.length < count) {
      const finalSelectedIds = new Set(bankPool.map((q) => q.id));
      bankPool.push(
        ...VERIFIED_QUESTION_BANK.filter((q) => !finalSelectedIds.has(q.id))
      );
    }

    return NextResponse.json({
      mode: "verified_bank",
      questions: bankPool.slice(0, count),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load questions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

