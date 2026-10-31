-- ============================================================================
-- HSCBuddy Database Schema & Row Level Security (RLS) Migration
-- Target: Supabase PostgreSQL
-- Covers all 15 relational tables + indices + RLS policies
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'HSC Student',
  hsc_year INTEGER NOT NULL DEFAULT 2026 CHECK (hsc_year BETWEEN 2024 AND 2032),
  academic_group TEXT NOT NULL DEFAULT 'Science' CHECK (academic_group IN ('Science', 'Commerce', 'Arts')),
  preferred_language TEXT NOT NULL DEFAULT 'Bangla & English' CHECK (preferred_language IN ('English', 'Bangla', 'Bangla & English')),
  daily_study_hours NUMERIC(4,2) NOT NULL DEFAULT 4.5 CHECK (daily_study_hours > 0 AND daily_study_hours <= 18),
  target_exam_name TEXT DEFAULT 'HSC Test Examination',
  target_exam_date DATE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SUBJECTS (Official Curriculum Metadata)
CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  academic_group TEXT NOT NULL DEFAULT 'Science',
  is_compulsory BOOLEAN NOT NULL DEFAULT FALSE,
  can_be_fourth_subject BOOLEAN NOT NULL DEFAULT FALSE,
  accent_color TEXT NOT NULL DEFAULT '#6366F1',
  syllabus_year INTEGER NOT NULL DEFAULT 2026,
  source_label TEXT NOT NULL DEFAULT 'NCTB Verified Curriculum',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PAPERS
CREATE TABLE IF NOT EXISTS public.papers (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  paper_number INTEGER NOT NULL CHECK (paper_number IN (1, 2)),
  paper_code TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CHAPTERS
CREATE TABLE IF NOT EXISTS public.chapters (
  id TEXT PRIMARY KEY,
  paper_id TEXT NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title_en TEXT NOT NULL,
  title_bn TEXT NOT NULL,
  default_effort_weight INTEGER NOT NULL DEFAULT 6 CHECK (default_effort_weight BETWEEN 1 AND 15),
  estimated_hours NUMERIC(4,1) NOT NULL DEFAULT 8.0,
  is_high_yield BOOLEAN NOT NULL DEFAULT FALSE,
  syllabus_version TEXT NOT NULL DEFAULT 'NCTB-2026',
  source_verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TOPICS
CREATE TABLE IF NOT EXISTS public.topics (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  title_en TEXT NOT NULL,
  title_bn TEXT,
  topic_order INTEGER NOT NULL DEFAULT 1,
  supports_mcq BOOLEAN NOT NULL DEFAULT TRUE,
  supports_cq BOOLEAN NOT NULL DEFAULT TRUE,
  youtube_query TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. STUDENT_SUBJECTS
CREATE TABLE IF NOT EXISTS public.student_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  is_fourth_subject BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);

-- 7. STUDENT_CHAPTER_PROGRESS
CREATE TABLE IF NOT EXISTS public.student_chapter_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (
    status IN ('not_started', 'learning', 'practicing', 'revision_needed', 'mastered')
  ),
  completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  estimated_mastery_percentage NUMERIC(5,2) CHECK (estimated_mastery_percentage BETWEEN 0 AND 100),
  custom_effort_weight INTEGER CHECK (custom_effort_weight BETWEEN 1 AND 15),
  confidence_level INTEGER NOT NULL DEFAULT 0 CHECK (confidence_level BETWEEN 0 AND 100),
  completed_activities JSONB NOT NULL DEFAULT '{"basics": false, "formulas": false, "tutorial": false, "mcq": false, "cq": false, "quiz": false}'::jsonb,
  last_studied_at TIMESTAMPTZ,
  last_tested_at TIMESTAMPTZ,
  last_test_score NUMERIC(5,2),
  test_attempts_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, chapter_id)
);

-- 8. STUDY_PLANS
CREATE TABLE IF NOT EXISTS public.study_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exam_name TEXT NOT NULL,
  exam_date DATE NOT NULL,
  daily_study_minutes INTEGER NOT NULL CHECK (daily_study_minutes > 0),
  total_available_minutes INTEGER NOT NULL,
  estimated_required_minutes INTEGER NOT NULL,
  feasibility_warning TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  source_type TEXT NOT NULL DEFAULT 'selected_chapters' CHECK (
    source_type IN ('selected_chapters', 'typed_text', 'uploaded_file', 'diagnostic_revision')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. STUDY_TASKS
CREATE TABLE IF NOT EXISTS public.study_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (
    task_type IN ('learn_basics', 'review_formulas', 'watch_tutorial', 'solve_mcq', 'solve_cq', 'review_mistakes', 'checkpoint_quiz', 'revision')
  ),
  estimated_duration_minutes INTEGER NOT NULL CHECK (estimated_duration_minutes > 0),
  actual_duration_minutes INTEGER DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  resource_search_query TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. QUESTIONS (Supports deterministic MCQs + future rubric-based CQ schema)
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'cq')),
  question_text TEXT NOT NULL,
  options JSONB, -- Array of 4 strings for MCQ
  correct_answer_index INTEGER CHECK (correct_answer_index BETWEEN 0 AND 3),
  cq_stem TEXT, -- Future CQ stimulus
  cq_rubric JSONB, -- Future CQ grading rubric (ka, kha, ga, gha)
  explanation TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  provenance TEXT NOT NULL DEFAULT 'verified_bank' CHECK (provenance IN ('verified_bank', 'ai_generated_validated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TEST_ATTEMPTS
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('diagnostic', 'subject', 'chapter', 'mixed')),
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
  chapter_id TEXT REFERENCES public.chapters(id) ON DELETE SET NULL,
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  unanswered_count INTEGER NOT NULL DEFAULT 0,
  accuracy_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  time_limit_seconds INTEGER,
  ai_summary TEXT,
  weak_topics TEXT[] DEFAULT '{}',
  strong_topics TEXT[] DEFAULT '{}',
  limited_evidence_warning BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. TEST_ANSWERS
CREATE TABLE IF NOT EXISTS public.test_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  selected_option_index INTEGER,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  cq_student_response JSONB,
  cq_human_verified_score NUMERIC(4,2),
  time_spent_seconds INTEGER DEFAULT 0
);

-- 13. ASSESSMENT_TOPIC_SCORES
CREATE TABLE IF NOT EXISTS public.assessment_topic_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  questions_count INTEGER NOT NULL CHECK (questions_count > 0),
  correct_count INTEGER NOT NULL DEFAULT 0,
  accuracy_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. CHAT_MESSAGES
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  suggested_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. LEARNING_RESOURCES
CREATE TABLE IF NOT EXISTS public.learning_resources (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'Bangla',
  video_url TEXT,
  search_query TEXT NOT NULL,
  duration_label TEXT,
  is_verified_video BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDICES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON public.chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_chapters_paper ON public.chapters(paper_id);
CREATE INDEX IF NOT EXISTS idx_progress_student ON public.student_chapter_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_study_tasks_student_date ON public.study_tasks(student_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_study_tasks_plan ON public.study_tasks(plan_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON public.questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_student ON public.test_attempts(student_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_topic_scores_student ON public.assessment_topic_scores(student_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_student ON public.chat_messages(student_id, created_at ASC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_chapter_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_topic_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;

-- Public read access for shared curriculum & verified question bank
CREATE POLICY "Public read subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Public read papers" ON public.papers FOR SELECT USING (true);
CREATE POLICY "Public read chapters" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Public read topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Public read questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Public read learning_resources" ON public.learning_resources FOR SELECT USING (true);

-- Strict user-owned access for student data
CREATE POLICY "Users own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users own student_subjects" ON public.student_subjects
  FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users own chapter_progress" ON public.student_chapter_progress
  FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users own study_plans" ON public.study_plans
  FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users own study_tasks" ON public.study_tasks
  FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users own test_attempts" ON public.test_attempts
  FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users own test_answers" ON public.test_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.test_attempts ta
      WHERE ta.id = test_answers.attempt_id AND ta.student_id = auth.uid()
    )
  );

CREATE POLICY "Users own assessment_topic_scores" ON public.assessment_topic_scores
  FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users own chat_messages" ON public.chat_messages
  FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

