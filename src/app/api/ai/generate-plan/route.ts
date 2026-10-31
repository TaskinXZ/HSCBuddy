import { NextRequest, NextResponse } from "next/server";
import {
  getGeminiClient,
  getGeminiModelName,
  extractJsonFromText,
  GeneratedStudyPlanSchema,
} from "@/lib/gemini";
import { getAllChapters, getChapterById } from "@/data/hsc-syllabus";
import { StudyPlan, StudyTask } from "@/types/hsc";
import { getDaysRemaining } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      examName = "HSC Upcoming Examination",
      examDate,
      dailyStudyHours = 4,
      selectedChapterIds = [],
      weakChapterIds = [],
      customApiKey,
    }: {
      examName: string;
      examDate: string;
      dailyStudyHours: number;
      selectedChapterIds: string[];
      weakChapterIds?: string[];
      customApiKey?: string;
    } = body;

    if (!examDate || selectedChapterIds.length === 0) {
      return NextResponse.json(
        { error: "Please provide an exam date and at least one syllabus chapter." },
        { status: 400 }
      );
    }

    const daysRemaining = Math.max(1, getDaysRemaining(examDate));
    const dailyMinutes = Math.max(30, Math.round(dailyStudyHours * 60));
    const totalAvailableMinutes = daysRemaining * dailyMinutes;

    const allChapters = getAllChapters();
    const validChapters = selectedChapterIds
      .map((id) => getChapterById(id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));

    if (validChapters.length === 0) {
      return NextResponse.json(
        { error: "None of the selected chapter IDs exist in the verified HSC syllabus." },
        { status: 400 }
      );
    }

    const genAI = getGeminiClient(customApiKey);

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({
          model: getGeminiModelName(),
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        });

        const todayStr = new Date().toISOString().split("T")[0];
        const prompt = `You are an expert HSC Science academic planner in Bangladesh.
Generate a realistic, day-by-day study schedule starting from ${todayStr} until ${examDate} (${daysRemaining} days remaining, max ${dailyMinutes} minutes/day).

Selected chapters to schedule:
${JSON.stringify(
  validChapters.map((c) => ({
    chapterId: c.id,
    subjectId: c.subjectId,
    subjectName: c.subjectNameEn,
    titleEn: c.titleEn,
    titleBn: c.titleBn,
    effortWeight: c.defaultEffortWeight,
    activityProfile: c.activityProfile,
    isWeak: weakChapterIds.includes(c.id),
    topics: c.topics.map((t) => ({ title: t.titleEn, youtubeQuery: t.youtubeQuery })),
  }))
)}

Rules:
1. Break each chapter into actionable tasks (e.g., learn_basics, review_formulas, watch_tutorial, solve_mcq, solve_cq, checkpoint_quiz).
2. Respect activityProfile: for "language_writing" (English/Bangla 2nd), do NOT assign numerical CQ/equation tasks; assign grammar rules, passage practice, or writing drills instead.
3. Keep each task duration between 20 and 60 minutes, and keep daily totalPlannedMinutes <= ${dailyMinutes}.
4. If estimatedRequiredStudyMinutes > ${totalAvailableMinutes}, provide a clear feasibilityWarning explaining the compromise.

Return ONLY valid JSON matching:
{
  "planTitle": "string",
  "examDate": "${examDate}",
  "totalAvailableStudyMinutes": ${totalAvailableMinutes},
  "estimatedRequiredStudyMinutes": number,
  "feasibilityWarning": "string or null",
  "dailySchedules": [
    {
      "date": "YYYY-MM-DD",
      "totalPlannedMinutes": number,
      "tasks": [
        {
          "subjectId": "string",
          "chapterId": "string",
          "taskType": "learn_basics | review_formulas | watch_tutorial | solve_mcq | solve_cq | review_mistakes | checkpoint_quiz | revision",
          "title": "string",
          "description": "string",
          "duration": number,
          "priority": "high | medium | low",
          "resourceSearchQuery": "string",
          "isCompleted": false
        }
      ]
    }
  ]
}`;

        const result = await model.generateContent(prompt);
        const parsed = extractJsonFromText(result.response.text());
        const validated = GeneratedStudyPlanSchema.parse(parsed);

        const planId = `plan-ai-${Date.now()}`;
        const tasks: StudyTask[] = [];
        const validChapterIdsSet = new Set(allChapters.map((c) => c.id));

        validated.dailySchedules.forEach((day, dIdx) => {
          day.tasks.forEach((t, tIdx) => {
            if (!validChapterIdsSet.has(t.chapterId)) return;
            tasks.push({
              id: `task-ai-${Date.now()}-${dIdx}-${tIdx}`,
              planId,
              subjectId: t.subjectId,
              chapterId: t.chapterId,
              scheduledDate: day.date,
              title: t.title,
              description: t.description,
              taskType: t.taskType,
              estimatedDurationMinutes: t.duration,
              actualDurationMinutes: 0,
              priority: t.priority,
              resourceSearchQuery: t.resourceSearchQuery,
              isCompleted: false,
              completedAt: null,
            });
          });
        });

        if (tasks.length > 0) {
          const studyPlan: StudyPlan = {
            id: planId,
            title: validated.planTitle,
            examName,
            examDate,
            dailyStudyMinutes: dailyMinutes,
            totalAvailableMinutes: validated.totalAvailableStudyMinutes,
            estimatedRequiredMinutes: validated.estimatedRequiredStudyMinutes,
            feasibilityWarning: validated.feasibilityWarning,
            isActive: true,
            sourceType: "selected_chapters",
            createdAt: new Date().toISOString(),
            tasks,
          };

          return NextResponse.json({
            mode: "live_gemini",
            plan: studyPlan,
          });
        }
      } catch (geminiErr) {
        console.warn("Gemini plan generation fallback triggered:", geminiErr);
      }
    }

    // Deterministic Constraint-Based HSC Study Planner Engine (Fallback when Gemini API is unavailable)
    const planId = `plan-${Date.now()}`;
    const sortedChapters = [...validChapters].sort((a, b) => {
      const aWeak = weakChapterIds.includes(a.id) ? 1 : 0;
      const bWeak = weakChapterIds.includes(b.id) ? 1 : 0;
      if (aWeak !== bWeak) return bWeak - aWeak;
      return b.defaultEffortWeight - a.defaultEffortWeight;
    });

    const generatedTasks: StudyTask[] = [];
    let currentDayIndex = 0;
    let currentDayMinutes = 0;
    let totalRequiredMinutes = 0;

    const getDateForOffset = (offset: number) => {
      const d = new Date();
      d.setDate(d.getDate() + Math.min(offset, Math.max(0, daysRemaining - 1)));
      return d.toISOString().split("T")[0];
    };

    sortedChapters.forEach((ch) => {
      const isWeak = weakChapterIds.includes(ch.id);
      const priority: "high" | "medium" | "low" =
        isWeak || ch.isHighYield ? "high" : "medium";
      const topicTitle = ch.topics[0]?.titleEn || ch.titleEn;
      const ytQuery =
        ch.topics[0]?.youtubeQuery ||
        `HSC ${ch.subjectNameEn} ${ch.titleEn} Bangla`;

      const chapterTaskBlueprints: Array<{
        taskType: StudyTask["taskType"];
        title: string;
        description: string;
        duration: number;
      }> =
        ch.activityProfile === "language_writing"
          ? [
              {
                taskType: "learn_basics",
                title: `${ch.subjectNameEn}: Study Core Rules & Text Analysis — ${ch.titleEn}`,
                description: `Master key rules and structures for ${topicTitle} (${ch.titleBn}).`,
                duration: 35,
              },
              {
                taskType: "review_formulas",
                title: `${ch.subjectNameEn}: Solve 10 Board Passage & Grammar Exercises — ${ch.titleEn}`,
                description: `Complete board question drills on ${topicTitle} and verify explanations.`,
                duration: 35,
              },
              {
                taskType: "checkpoint_quiz",
                title: `${ch.subjectNameEn}: Timed Checkpoint Quiz — ${ch.titleEn}`,
                description: `Take a quick 10-minute readiness check on ${ch.titleEn}.`,
                duration: 15,
              },
            ]
          : [
              {
                taskType: "learn_basics",
                title: `${ch.subjectNameEn}: Understand Core Concepts — ${ch.titleEn}`,
                description: `Study foundational concepts and derivations in ${topicTitle} (${ch.titleBn}).`,
                duration: 35,
              },
              {
                taskType: "watch_tutorial",
                title: `${ch.subjectNameEn}: Watch Topic Lecture & Worked Examples — ${ch.titleEn}`,
                description: `Watch Bangla tutorial on ${topicTitle} and note down key formulas.`,
                duration: 30,
              },
              {
                taskType: "solve_mcq",
                title: `${ch.subjectNameEn}: Solve 15 Board & Admission MCQs — ${ch.titleEn}`,
                description: `Practice timed MCQs covering ${topicTitle}.`,
                duration: 25,
              },
              {
                taskType: "solve_cq",
                title: `${ch.subjectNameEn}: Solve 2 Creative Questions (CQ) — ${ch.titleEn}`,
                description: `Write full stem (গ ও ঘ) solutions for ${ch.titleEn}.`,
                duration: 35,
              },
              {
                taskType: "checkpoint_quiz",
                title: `${ch.subjectNameEn}: Complete Checkpoint Quiz & Mistake Review — ${ch.titleEn}`,
                description: `Verify your chapter mastery in the Mock Test Center.`,
                duration: 15,
              },
            ];

      chapterTaskBlueprints.forEach((bp, idx) => {
        totalRequiredMinutes += bp.duration;
        if (
          currentDayMinutes + bp.duration > dailyMinutes &&
          currentDayMinutes > 0
        ) {
          currentDayIndex++;
          currentDayMinutes = 0;
        }
        const scheduledDate = getDateForOffset(currentDayIndex);
        currentDayMinutes += bp.duration;

        generatedTasks.push({
          id: `task-gen-${ch.id}-${idx}-${Date.now()}`,
          planId,
          subjectId: ch.subjectId,
          chapterId: ch.id,
          scheduledDate,
          title: bp.title,
          description: bp.description,
          taskType: bp.taskType,
          estimatedDurationMinutes: bp.duration,
          actualDurationMinutes: 0,
          priority,
          resourceSearchQuery: ytQuery,
          isCompleted: false,
          completedAt: null,
        });
      });
    });

    const feasibilityWarning =
      totalRequiredMinutes > totalAvailableMinutes
        ? `Workload Alert: Your selected ${validChapters.length} chapters require ~${Math.round(
            totalRequiredMinutes / 60
          )} hours of structured study, which exceeds your ${Math.round(
            totalAvailableMinutes / 60
          )} available hours (${daysRemaining} days × ${dailyStudyHours}h/day). High-priority and weak chapters have been front-loaded first; consider increasing daily study hours or focusing on high-yield chapters.`
        : null;

    const studyPlan: StudyPlan = {
      id: planId,
      title: `${examName} Structured Study Schedule`,
      examName,
      examDate,
      dailyStudyMinutes: dailyMinutes,
      totalAvailableMinutes,
      estimatedRequiredMinutes: totalRequiredMinutes,
      feasibilityWarning,
      isActive: true,
      sourceType: "selected_chapters",
      createdAt: new Date().toISOString(),
      tasks: generatedTasks,
    };

    return NextResponse.json({
      mode: "deterministic_scheduler",
      providerNote:
        "Generated using HSCBuddy's Constraint-Based Syllabus Scheduler (prioritizing weak & high-yield chapters within your daily time budget).",
      plan: studyPlan,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate study plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

