export type ChapterStatus =
  | "not_started"
  | "learning"
  | "practicing"
  | "revision_needed"
  | "mastered";

export type StudyTaskType =
  | "learn_basics"
  | "review_formulas"
  | "watch_tutorial"
  | "solve_mcq"
  | "solve_cq"
  | "review_mistakes"
  | "checkpoint_quiz"
  | "revision";

export interface TopicItem {
  id: string;
  chapterId: string;
  titleEn: string;
  titleBn: string;
  order: number;
  supportsMcq: boolean;
  supportsCq: boolean;
  youtubeQuery: string;
}

export interface ChapterItem {
  id: string;
  paperId: string;
  subjectId: string;
  chapterNumber: number;
  titleEn: string;
  titleBn: string;
  defaultEffortWeight: number; // 1 - 15 heuristic weight
  estimatedHours: number;
  isHighYield: boolean;
  syllabusVersion: string;
  sourceVerified: boolean;
  topics: TopicItem[];
}

export interface PaperItem {
  id: string;
  subjectId: string;
  paperNumber: 1 | 2;
  paperCode: string;
  nameEn: string;
  nameBn: string;
  chapters: ChapterItem[];
}

export interface SubjectItem {
  id: string;
  code: string;
  nameEn: string;
  nameBn: string;
  academicGroup: "Science";
  isCompulsory: boolean;
  canBeFourthSubject: boolean;
  accentColor: string;
  syllabusYear: number;
  sourceLabel: string;
  activityProfile: "stem_numerical" | "stem_conceptual" | "language_writing" | "ict_mixed";
  papers: PaperItem[];
}

export interface ChapterActivities {
  basics: boolean;
  formulas: boolean;
  tutorial: boolean;
  mcq: boolean;
  cq: boolean;
  quiz: boolean;
}

export interface StudentChapterProgress {
  chapterId: string;
  status: ChapterStatus;
  completionPercentage: number; // Weighted activity completion (0 - 100)
  estimatedMasteryPercentage: number | null; // Null = "Not assessed"
  customEffortWeight?: number; // User-editable override
  confidenceLevel: number; // Self-reported confidence (0 - 100), separate from mastery
  completedActivities: ChapterActivities;
  lastStudiedAt: string | null;
  lastTestedAt: string | null;
  lastTestScore: number | null;
  testAttemptsCount: number;
}

export interface StudyTask {
  id: string;
  planId: string;
  subjectId: string;
  chapterId: string;
  scheduledDate: string; // YYYY-MM-DD
  title: string;
  description: string;
  taskType: StudyTaskType;
  estimatedDurationMinutes: number;
  actualDurationMinutes: number;
  priority: "high" | "medium" | "low";
  resourceSearchQuery: string;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface StudyPlan {
  id: string;
  title: string;
  examName: string;
  examDate: string; // YYYY-MM-DD
  dailyStudyMinutes: number;
  totalAvailableMinutes: number;
  estimatedRequiredMinutes: number;
  feasibilityWarning: string | null;
  isActive: boolean;
  sourceType: "selected_chapters" | "typed_text" | "uploaded_file" | "diagnostic_revision";
  createdAt: string;
  tasks: StudyTask[];
}

export interface ExtractedSyllabusItem {
  id: string;
  subjectId: string;
  subjectName: string;
  paperName: string;
  chapterId: string; // Mapped to official chapter ID or custom
  chapterNumber: number;
  chapterTitleEn: string;
  chapterTitleBn: string;
  topics: string[];
  estimatedMinutes: number;
  priority: "high" | "medium" | "low";
  selected: boolean;
}

export interface MCQQuestion {
  id: string;
  subjectId: string;
  chapterId: string;
  topic: string;
  questionText: string;
  options: [string, string, string, string];
  correctAnswerIndex: 0 | 1 | 2 | 3;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  provenance: "verified_bank" | "ai_generated_validated";
}

export interface TopicScoreBreakdown {
  topic: string;
  chapterId: string;
  subjectId: string;
  questionsCount: number;
  correctCount: number;
  accuracyPercentage: number;
}

export interface TestAttemptAnswer {
  questionId: string;
  selectedOptionIndex: number | null;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface TestAttempt {
  id: string;
  title: string;
  testType: "diagnostic" | "subject" | "chapter" | "mixed";
  subjectId: string | null;
  chapterId: string | null;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  accuracyPercentage: number;
  timeTakenSeconds: number;
  timeLimitSeconds: number | null;
  aiSummary: string;
  weakTopics: string[];
  strongTopics: string[];
  limitedEvidenceWarning: boolean;
  completedAt: string;
  questions: MCQQuestion[];
  answers: TestAttemptAnswer[];
  topicBreakdown: TopicScoreBreakdown[];
}

export interface MentorSuggestedAction {
  id: string;
  label: string;
  actionType:
    | "start_quiz"
    | "open_planner"
    | "review_chapter"
    | "generate_revision_plan"
    | "open_syllabus";
  payload?: {
    subjectId?: string;
    chapterId?: string;
    topic?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  isAiLive?: boolean;
  suggestedActions?: MentorSuggestedAction[];
}

export interface StudentProfile {
  id: string;
  fullName: string;
  collegeName: string;
  hscYear: number;
  academicGroup: "Science";
  enrolledSubjectIds: string[];
  fourthSubjectId: string;
  preferredLanguage: "English" | "Bangla" | "Bangla & English";
  dailyStudyHours: number;
  targetExamName: string;
  targetExamDate: string; // YYYY-MM-DD
  isDemo: boolean;
  onboardingCompleted: boolean;
}

export interface YouTubeResourceItem {
  id: string;
  subjectId: string;
  chapterId: string;
  topic: string;
  title: string;
  channelName: string;
  language: "Bangla" | "English";
  videoUrl: string | null;
  searchQuery: string;
  durationLabel: string | null;
  isVerifiedVideo: boolean;
  thumbnailUrl?: string;
}

