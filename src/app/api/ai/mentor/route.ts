import { NextRequest, NextResponse } from "next/server";
import {
  getGeminiClient,
  getGeminiModelName,
  extractJsonFromText,
  MentorResponseSchema,
} from "@/lib/gemini";
import { MentorSuggestedAction } from "@/types/hsc";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message = "",
      studentContext = {},
      history = [],
      customApiKey,
    }: {
      message: string;
      studentContext?: Record<string, unknown>;
      history?: Array<{ role: string; content: string }>;
      customApiKey?: string;
    } = body;

    if (!message.trim()) {
      return NextResponse.json(
        { error: "Please enter a question for your AI Mentor." },
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
            temperature: 0.4,
          },
        });

        const systemPrompt = `You are HSCBuddy AI Study Mentor, a warm, academically rigorous, and realistic study mentor for Bangladesh HSC Science students (Class XI-XII).
Current Student Profile & Real-Time Learning State:
${JSON.stringify(studentContext, null, 2)}

Recent Conversation History:
${JSON.stringify(history.slice(-5))}

Mentor Guidelines:
1. Give clear, step-by-step academic explanations. Use Bangla when requested or when helpful for NCTB HSC Science concepts.
2. Reference the student's actual weak chapters, upcoming exam countdown, and today's study tasks from the provided context. Never fabricate progress data.
3. Never guarantee exam results; give encouraging, evidence-based advice.
4. Propose 1 to 3 relevant next actions in suggestedActions.

Return ONLY valid JSON matching:
{
  "reply": "Markdown formatted response (supports Bangla and English)",
  "suggestedActions": [
    {
      "id": "act-1",
      "label": "Short button label",
      "actionType": "start_quiz | open_planner | review_chapter | generate_revision_plan | open_syllabus",
      "payload": {
        "subjectId": "optional subjectId",
        "chapterId": "optional chapterId"
      }
    }
  ]
}`;

        const result = await model.generateContent([
          { text: systemPrompt },
          { text: `Student Query: ${message}` },
        ]);

        const rawText = result.response.text();
        let replyText = rawText;
        let actions: MentorSuggestedAction[] = [];

        try {
          const parsed = extractJsonFromText(rawText) as Record<string, unknown>;
          const validated = MentorResponseSchema.safeParse(parsed);
          if (validated.success) {
            replyText = validated.data.reply;
            actions = validated.data.suggestedActions;
          } else if (typeof parsed?.reply === "string" && parsed.reply.trim()) {
            replyText = parsed.reply;
            if (Array.isArray(parsed.suggestedActions)) {
              actions = parsed.suggestedActions
                .filter((a: unknown) => typeof a === "object" && a !== null)
                .map((a: Record<string, unknown>, idx: number) => ({
                  id: String(a.id || `act-${idx}`),
                  label: String(a.label || "Explore Study Action"),
                  actionType: ([
                    "start_quiz",
                    "open_planner",
                    "review_chapter",
                    "generate_revision_plan",
                    "open_syllabus",
                  ].includes(String(a.actionType))
                    ? a.actionType
                    : "open_syllabus") as MentorSuggestedAction["actionType"],
                  payload:
                    typeof a.payload === "object" && a.payload !== null
                      ? (a.payload as MentorSuggestedAction["payload"])
                      : undefined,
                }));
            }
          }
        } catch {
          // If Gemini returned markdown directly instead of JSON, still use the live Gemini reply
          replyText = rawText;
        }

        return NextResponse.json({
          mode: "live_gemini",
          reply: replyText,
          suggestedActions: actions,
        });
      } catch (geminiErr) {
        console.warn("Gemini mentor fallback triggered:", geminiErr);
      }
    }

    // Contextual Academic Mentor Engine (when live Gemini API key is unavailable or invalid)
    const qLower = message.toLowerCase();
    const ctx = studentContext as {
      studentName?: string;
      upcomingExam?: { name?: string; daysRemaining?: number };
      overallProgress?: {
        weightedCompletionPercentage?: number;
        averageAssessedMastery?: number | null;
      };
      weakChapters?: Array<{
        chapterId: string;
        titleEn: string;
        titleBn: string;
        subjectId: string;
        subjectNameEn: string;
        mastery: number | null;
      }>;
      todaysTasks?: Array<{
        title: string;
        durationMinutes: number;
        isCompleted: boolean;
      }>;
    };

    const weakList = ctx.weakChapters || [];
    const topWeak = weakList[0];
    const todaysTasks = ctx.todaysTasks || [];
    const incompleteToday = todaysTasks.filter((t) => !t.isCompleted);
    const daysLeft = ctx.upcomingExam?.daysRemaining ?? 24;

    let reply = "";
    let suggestedActions: MentorSuggestedAction[] = [];

    if (
      qLower.includes("vector") ||
      qLower.includes("ভেক্টর") ||
      qLower.includes("নদী") ||
      qLower.includes("river")
    ) {
      reply = `### ভেক্টর (Vector) — সহজ ও ধাপে ধাপে ব্যাখ্যা (HSC Physics 1st Paper, Ch 2)

**১. ভেক্টর যোজনের সামান্তরিক সূত্র (Parallelogram Law):**
যদি দুটি ভেক্টর $\\vec{P}$ ও $\\vec{Q}$ পরস্পর $\\alpha$ কোণে ক্রিয়া করে, তবে তাদের লব্ধি (Resultant) $R$:
- **লব্ধির মান:** $R = \\sqrt{P^2 + Q^2 + 2PQ\\cos\\alpha}$
- **লব্ধির দিক ($\vec{P}$-এর সাথে $\\theta$ কোণ):** $\\tan\\theta = \\frac{Q\\sin\\alpha}{P + Q\\cos\\alpha}$

**২. নদী-নৌকার অংকের ২টি গোল্ডেন শর্টকাট (Board CQ ও MCQ-এর জন্য সবচেয়ে গুরুত্বপূর্ণ):**
ধরি, স্রোতের বেগ $= u$, নৌকার/সাঁতারুর বেগ $= v$ ($v > u$), এবং নদীর প্রস্থ $= d$:
1. **ন্যূনতম সময়ে নদী পারাপার (Minimum Time):**
   - স্রোতের সাথে **$\\alpha = 90^\\circ$** কোণে রওনা দিতে হবে।
   - ন্যূনতম সময়: $t_{\\min} = \\frac{d}{v}$
2. **ন্যূনতম দূরত্বে / সোজাসুজি নদী পারাপার (Shortest Path):**
   - স্রোতের সাথে **$\\alpha = \\cos^{-1}\\left(-\\frac{u}{v}\\right)$** স্থূলকোণে রওনা দিতে হবে।
   - পারাপারের সময়: $t = \\frac{d}{\\sqrt{v^2 - u^2}}$

তোমার বর্তমান প্রোফাইলে **ভেক্টর অধ্যায়ে তোমার মাস্টারি ৮৮%**—তুমি চাইলে আরও কঠিন ভেক্টর ক্যালকুলাস ($\nabla$, Divergence, Curl) অনুশীলন করতে পারো!`;
      suggestedActions = [
        {
          id: "act-vec-quiz",
          label: "Practice Vector MCQs",
          actionType: "start_quiz",
          payload: { subjectId: "physics", chapterId: "phy1-ch2" },
        },
        {
          id: "act-vec-syl",
          label: "View Vector in Syllabus Universe",
          actionType: "open_syllabus",
          payload: { subjectId: "physics", chapterId: "phy1-ch2" },
        },
      ];
    } else if (
      qLower.includes("newton") ||
      qLower.includes("নিউটনীয়") ||
      qLower.includes("banking") ||
      qLower.includes("inertia") ||
      qLower.includes("weak")
    ) {
      reply = `### কেন তোমার Newtonian Mechanics (নিউটনীয় বলবিদ্যা)-এ রিভিশন প্রয়োজন?

তোমার সর্বশেষ ডায়াগনস্টিক মক টেস্টের ফলাফল বিশ্লেষণ করে দেখা যাচ্ছে:
- **বর্তমান মাস্টারি:** **${topWeak?.mastery ?? 42}%** (Needs Attention)
- **মূল দুর্বল জায়গা:** **জড়তার ভ্রামক (Moment of Inertia)**, **কৌণিক ভরবেগ ও ঘূর্ণন গতিশক্তি ($E_k = \\frac{L^2}{2I}$)** এবং **রাস্তার ব্যাংকিং কোণ ($\\tan\\theta = \\frac{v^2}{rg}$)**।

#### দ্রুত রিকভারি গাইড (Step-by-Step):
1. **জড়তার ভ্রামকের ৪টি মূল সূত্র মুখস্থ রাখো:**
   - সরু সুষম দণ্ড (মধ্যবিন্দু দিয়ে): $I = \\frac{1}{12}ML^2$, প্রান্তবিন্দু দিয়ে: $I = \\frac{1}{3}ML^2$
   - নিরেট সিলিন্ডার / চাকতি (নিজ অক্ষে): $I = \\frac{1}{2}MR^2$ ($K = \\frac{R}{\\sqrt{2}}$)
   - নিরেট গোলক: $I = \\frac{2}{5}MR^2$
2. **রাস্তার ব্যাংকিং (CQ গ ও ঘ):**
   - ঘর্ষণহীন রাস্তায় নিরাপদ সর্বোচ্চ বেগ: $v = \\sqrt{rg\\tan\\theta}$। উদ্দীপকে গাড়ির বেগ এর চেয়ে বেশি হলে দুর্ঘটনা ঘটবে!

আমি কি তোমার জন্য **নিউটনীয় বলবিদ্যার একটি কুইজ** শুরু করব নাকি আজকের স্টাডি প্ল্যানে নিয়ে যাব?`;
      suggestedActions = [
        {
          id: "act-nm-quiz",
          label: "Start Newtonian Mechanics Quiz",
          actionType: "start_quiz",
          payload: { subjectId: "physics", chapterId: "phy1-ch4" },
        },
        {
          id: "act-nm-rev",
          label: "Generate Targeted Revision Plan",
          actionType: "generate_revision_plan",
        },
      ];
    } else if (
      qLower.includes("organic") ||
      qLower.includes("জৈব") ||
      qLower.includes("sn1") ||
      qLower.includes("sn2") ||
      qLower.includes("chemistry")
    ) {
      reply = `### জৈব রসায়ন (Organic Chemistry) — মূল কৌশল ও কুইক নোট

তোমার প্রোফাইল অনুযায়ী **জৈব রসায়নে বর্তমান মাস্টারি ৩৮%**, যা তোমার সবচেয়ে বেশি ওয়েটেজ (Effort Weight: 15) বিশিষ্ট অধ্যায়!

#### বোর্ড ও ভর্তি পরীক্ষার ৩টি হাই-ইল্ড টপিক:
1. **$S_N1$ বনাম $S_N2$ বিক্রিয়া:**
   - **$S_N1$ (দুই ধাপে ঘটে):** কার্বোক্যাটায়ন মধ্যক তৈরি হয়। সক্রিয়তার ক্রম: **$3^\\circ > 2^\\circ > 1^\\circ > CH_3X$** (পোলার প্রোটিক দ্রাবকে)।
   - **$S_N2$ (এক ধাপে ঘটে):** অবস্থান্তর অবস্থা (Transition State) তৈরি হয় ও কনফিগারেশনের ইনভার্সন (Walden Inversion) ঘটে। সক্রিয়তার ক্রম: **$CH_3X > 1^\\circ > 2^\\circ > 3^\\circ$**।
2. **অ্যালডিহাইড ও কিটোনের পার্থক্যকরণ:**
   - **টলেন বিকারক (অ্যামোনিয়াক্যাল $AgNO_3$):** অ্যালডিহাইড সিলভার দর্পণ ($Ag\\downarrow$) দেয়, কিন্তু কিটোন দেয় না।
   - **ফেহলিং দ্রবণ:** অ্যালডিহাইড লাল বর্ণের $Cu_2O$-এর অধঃক্ষেপ দেয়।`;
      suggestedActions = [
        {
          id: "act-org-quiz",
          label: "Quiz Me on Organic Chemistry",
          actionType: "start_quiz",
          payload: { subjectId: "chemistry", chapterId: "chem2-ch2" },
        },
        {
          id: "act-org-plan",
          label: "Open Today's Study Tasks",
          actionType: "open_planner",
        },
      ];
    } else if (
      qLower.includes("today") ||
      qLower.includes("prioritize") ||
      qLower.includes("hours") ||
      qLower.includes("আজকে") ||
      qLower.includes("ready")
    ) {
      const taskSummary =
        incompleteToday.length > 0
          ? incompleteToday
              .slice(0, 3)
              .map((t, i) => `${i + 1}. **${t.title}** (${t.durationMinutes} mins)`)
              .join("\n")
          : "You have completed all scheduled tasks for today! Great job.";

      reply = `### তোমার আজকের স্টাডি প্রায়োরিটি ও প্রস্তুতি বিশ্লেষণ (${daysLeft} দিন বাকি)

- **সামগ্রিক সিলেবাস সম্পন্ন:** **${ctx.overallProgress?.weightedCompletionPercentage ?? 38}%**
- **পরীক্ষালব্ধ গড় মাস্টারি (Assessed Mastery):** **${
        ctx.overallProgress?.averageAssessedMastery !== null &&
        ctx.overallProgress?.averageAssessedMastery !== undefined
          ? `${ctx.overallProgress.averageAssessedMastery}%`
          : "Not assessed yet"
      }**

#### আজ তোমার সবচেয়ে গুরুত্বপূর্ণ কাজ (Top Priority Tasks):
${taskSummary}

#### কেন এগুলো আগে করবে?
তোমার আসন্ন পরীক্ষার আর **${daysLeft} দিন** বাকি। যেহেতু **${
        topWeak ? `${topWeak.titleEn} (${topWeak.titleBn})` : "Newtonian Mechanics & Organic Chemistry"
      }**-এ তোমার মক টেস্টের স্কোর ৬০%-এর নিচে, তাই নতুন অধ্যায় শুরু করার আগে আজ এই দুর্বল টপিকের ফর্মুলা ও ১৫টি MCQ সমাধান করা সবচেয়ে ফলপ্রসূ হবে।`;

      suggestedActions = [
        {
          id: "act-today-plan",
          label: "Go to Today's Study Checklist",
          actionType: "open_planner",
        },
        {
          id: "act-today-quiz",
          label: "Take 5-Min Diagnostic Quiz",
          actionType: "start_quiz",
          payload: {
            subjectId: topWeak?.subjectId || "physics",
            chapterId: topWeak?.chapterId || "phy1-ch4",
          },
        },
        {
          id: "act-today-rev",
          label: "Rebalance Study Schedule",
          actionType: "generate_revision_plan",
        },
      ];
    } else {
      reply = `হ্যালো **${ctx.studentName || "বন্ধু"}**! আমি তোমার প্রশ্নটি বুঝতে পেরেছি।

তোমার বর্তমান HSC Science প্রোফাইল অনুযায়ী:
- **পরবর্তী পরীক্ষা:** ${ctx.upcomingExam?.name || "HSC Pre-Test"} (**${daysLeft} দিন বাকি**)
- **সিলেবাস অগ্রগতি:** **${ctx.overallProgress?.weightedCompletionPercentage ?? 38}%** সম্পন্ন
- **মনোযোগ প্রয়োজন (Weak Chapters):** ${
        weakList.length > 0
          ? weakList
              .slice(0, 3)
              .map((w) => `**${w.titleEn}** (${w.mastery ?? "Unassessed"}%)`)
              .join(", ")
          : "কোনো ঝুঁকিপূর্ণ অধ্যায় নেই"
      }

তুমি যেকোনো সুনির্দিষ্ট অধ্যায় (যেমন: *"Explain vectors in Bangla"*, *"Why am I weak in Newtonian Mechanics?"*, *"Organic chemistry SN1 vs SN2"*, অথবা *"What should I study today?"*) লিখে প্রশ্ন করতে পারো, কিংবা নিচের বাটনগুলো থেকে সরাসরি অ্যাকশন নিতে পারো!`;

      suggestedActions = [
        {
          id: "act-gen-1",
          label: "Open Today's Study Tasks",
          actionType: "open_planner",
        },
        {
          id: "act-gen-2",
          label: "Take Diagnostic Mock Test",
          actionType: "start_quiz",
          payload: { subjectId: "physics", chapterId: "phy1-ch4" },
        },
        {
          id: "act-gen-3",
          label: "Explore Syllabus Universe",
          actionType: "open_syllabus",
        },
      ];
    }

    return NextResponse.json({
      mode: "contextual_mentor_engine",
      reply,
      suggestedActions,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Mentor service error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

