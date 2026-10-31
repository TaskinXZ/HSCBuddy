"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  BookOpen,
  Play,
  Compass,
  Clock,
  ArrowRight,
  User,
} from "lucide-react";
import { useHSCBuddy } from "@/lib/store";
import { ChatMessage, MentorSuggestedAction } from "@/types/hsc";
import { cn, getDaysRemaining } from "@/lib/utils";

const QUICK_PROMPTS = [
  "What should I study today?",
  "Why am I weak in Newtonian Mechanics?",
  "Explain vectors in Bangla",
  "I only have two hours today. What should I prioritize?",
  "Quiz me on organic chemistry",
  "Am I ready for my Physics exam?",
];

function MentorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    isHydrated,
    profile,
    chatMessages,
    addChatMessage,
    clearChatHistory,
    getOverallStats,
    getWeakChapters,
    getTodaysTasks,
    getCompactMentorContext,
    generateTargetedRevisionPlan,
  } = useHSCBuddy();

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [revisionToast, setRevisionToast] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const initialQueryHandledRef = useRef(false);

  const qParam = searchParams.get("q");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isSending]);

  // Handle ?q= param if provided
  useEffect(() => {
    if (isHydrated && qParam && !initialQueryHandledRef.current) {
      initialQueryHandledRef.current = true;
      handleSendMessage(qParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, qParam]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      createdAt: new Date().toISOString(),
    };

    addChatMessage(userMsg);
    if (!textToSend) setInput("");
    setIsSending(true);
    setRevisionToast(null);

    try {
      const compactContext = getCompactMentorContext();
      const historyPayload = chatMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          studentContext: compactContext,
          history: historyPayload,
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content:
          data.reply ||
          "I analyzed your HSC Science profile. Please check the suggested actions below.",
        createdAt: new Date().toISOString(),
        isAiLive: data.mode === "live_gemini",
        suggestedActions: data.suggestedActions || [],
      };

      addChatMessage(assistantMsg);
    } catch (e) {
      console.error("Failed to reach AI mentor:", e);
      addChatMessage({
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "Sorry, I encountered a temporary network issue. Please try asking again or use one of the quick prompts below.",
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestedAction = (action: MentorSuggestedAction) => {
    if (action.actionType === "start_quiz") {
      const params = new URLSearchParams();
      if (action.payload?.subjectId)
        params.set("subject", action.payload.subjectId);
      if (action.payload?.chapterId)
        params.set("chapter", action.payload.chapterId);
      if (!action.payload?.subjectId && !action.payload?.chapterId) {
        params.set("mode", "diagnostic");
      }
      router.push(`/tests?${params.toString()}`);
    } else if (action.actionType === "open_planner") {
      router.push("/planner");
    } else if (
      action.actionType === "open_syllabus" ||
      action.actionType === "review_chapter"
    ) {
      const params = new URLSearchParams();
      if (action.payload?.subjectId)
        params.set("subject", action.payload.subjectId);
      if (action.payload?.chapterId)
        params.set("chapter", action.payload.chapterId);
      router.push(`/syllabus?${params.toString()}`);
    } else if (action.actionType === "generate_revision_plan") {
      const plan = generateTargetedRevisionPlan();
      setRevisionToast(
        `Updated "${plan.title}" with high-priority weakness recovery tasks!`
      );
    }
  };

  if (!isHydrated) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="h-96 rounded-2xl bg-slate-200/70 animate-pulse" />
      </div>
    );
  }

  const stats = getOverallStats();
  const weakChapters = getWeakChapters();
  const todaysTasks = getTodaysTasks();
  const daysRemaining = getDaysRemaining(profile.targetExamDate);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Bot className="w-3.5 h-3.5" />
            Context-Aware Bilingual Study Mentor (Bangla & English)
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            HSCBuddy AI Study Mentor
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Connected to your real-time syllabus progress, mock test weaknesses, and daily study schedule.
          </p>
        </div>

        <button
          type="button"
          onClick={clearChatHistory}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Conversation
        </button>
      </div>

      {revisionToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{revisionToast}</span>
          </div>
          <Link
            href="/planner"
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shrink-0"
          >
            View Study Plan →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Chat Stream & Input */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[680px]">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {chatMessages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-start gap-3",
                    isUser ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      isUser
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-900 text-white"
                    )}
                  >
                    {isUser ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl p-4 space-y-3",
                      isUser
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-50 border border-slate-200/80 text-slate-800"
                    )}
                  >
                    {!isUser && msg.isAiLive && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-bold">
                        <Sparkles className="w-2.5 h-2.5" />
                        Live Gemini 2.5 Flash
                      </div>
                    )}
                    <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>

                    {/* Interactive Suggested Action Chips */}
                    {!isUser &&
                      msg.suggestedActions &&
                      msg.suggestedActions.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/70 flex flex-wrap gap-2">
                          {msg.suggestedActions.map((act) => (
                            <button
                              key={act.id}
                              type="button"
                              onClick={() => handleSuggestedAction(act)}
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5"
                            >
                              {act.actionType === "start_quiz" && (
                                <Play className="w-3 h-3 fill-current" />
                              )}
                              {act.actionType === "open_planner" && (
                                <Calendar className="w-3 h-3" />
                              )}
                              {act.actionType === "open_syllabus" && (
                                <Compass className="w-3 h-3" />
                              )}
                              {act.actionType === "generate_revision_plan" && (
                                <Sparkles className="w-3 h-3" />
                              )}
                              {act.label}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-xs text-slate-600 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  Analyzing your syllabus progress & diagnostic scores...
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isSending}
                onClick={() => handleSendMessage(prompt)}
                className="px-3 py-1.5 rounded-full bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-[11px] font-semibold text-slate-700 whitespace-nowrap transition-all shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-4 border-t border-slate-200/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask in English or বাংলা (e.g., 'Explain vectors in Bangla' or 'What should I study today?')..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4" />
              Ask Mentor
            </button>
          </form>
        </div>

        {/* Right Column: Live Context Panel */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold">
                <Sparkles className="w-3 h-3" />
                Live Mentor Context
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Synced
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold">
                What Your AI Mentor Sees Right Now
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Compact profile state injected into every mentor prompt:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700/70">
                <div className="text-slate-400 text-[10px]">Exam Countdown</div>
                <div className="font-bold text-white mt-0.5">
                  {daysRemaining} Days Left
                </div>
                <div className="text-[10px] text-indigo-300 truncate">
                  {profile.targetExamName}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700/70">
                <div className="text-slate-400 text-[10px]">
                  Assessed Mastery
                </div>
                <div className="font-bold text-emerald-400 mt-0.5">
                  {stats.averageAssessedMastery !== null
                    ? `${stats.averageAssessedMastery}%`
                    : "Not assessed"}
                </div>
                <div className="text-[10px] text-slate-400">
                  {stats.weightedCompletionPercentage}% tasks done
                </div>
              </div>
            </div>

            {/* Weak Chapters in Context */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Detected Weaknesses ({weakChapters.length})
              </div>
              {weakChapters.length === 0 ? (
                <div className="text-[11px] text-slate-400">
                  No chapters currently flagged as weak.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {weakChapters.slice(0, 4).map((w) => (
                    <div
                      key={w.chapterId}
                      className="p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/60 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="truncate">
                        <div className="font-semibold text-white truncate">
                          {w.titleEn}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {w.subjectNameEn} • {w.titleBn}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold shrink-0">
                        {w.mastery !== null ? `${w.mastery}%` : "Review"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Today's Tasks in Context */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Today&apos;s Scheduled Tasks ({todaysTasks.length})
              </div>
              <div className="space-y-1.5">
                {todaysTasks.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className="p-2 rounded-lg bg-slate-800/50 text-[11px] flex items-center justify-between gap-2"
                  >
                    <span
                      className={cn(
                        "truncate",
                        t.isCompleted
                          ? "line-through text-slate-500"
                          : "text-slate-200"
                      )}
                    >
                      {t.title}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {t.estimatedDurationMinutes}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick Actions
            </h3>
            <Link
              href="/tests?mode=diagnostic"
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40 flex items-center justify-between text-xs font-bold text-slate-800 transition-all"
            >
              <span className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-indigo-600" />
                Take Diagnostic Quiz
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/syllabus"
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40 flex items-center justify-between text-xs font-bold text-slate-800 transition-all"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                Inspect Syllabus Universe
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MentorPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 max-w-6xl mx-auto">
          <div className="h-96 rounded-2xl bg-slate-200/70 animate-pulse" />
        </div>
      }
    >
      <MentorContent />
    </Suspense>
  );
}

