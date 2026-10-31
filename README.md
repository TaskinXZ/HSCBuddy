# HSCBuddy — Your Syllabus. Your Progress. Your AI Study Mentor.

**HSCBuddy** is an AI-powered personalized study mentor built for Bangladesh HSC Science students (Classes XI & XII). It unifies visual syllabus weight tracking, chapter checkpoint activities, AI study planning (with syllabus text/PDF/image extraction and human confirmation), Chorcha/Daricomma-inspired mock tests, YouTube learning recommendations, and a bilingual (Bangla & English) contextual AI mentor.

---

## Core Product Principle: The Unified Adaptive Learning Loop

Every learning interaction in HSCBuddy updates a shared student learning profile:
1. **Mock Test Results → Chapter Mastery**: Completing a diagnostic or chapter quiz calculates real accuracy and updates `estimatedMasteryPercentage` in the **Syllabus Universe**.
2. **Honest Mastery vs. Task Completion**: Checking off study activities (`Learn Basics`, `Formulas`, `Watch Tutorial`, `Solve MCQs`, `Solve CQs`, `Checkpoint Quiz`) increases **Completion %**, but never fabricates **Mastery %**. Untested chapters explicitly display `"Not assessed"`.
3. **Mastery → Study Priorities & Schedule**: Weak chapters (`< 55%` test score) are flagged as `Needs Attention` and can be injected into the active **AI Study Plan** with 1 click.
4. **Profile → Contextual AI Mentor**: The **AI Study Mentor** receives a compact, real-time snapshot of the student's exam countdown, weak chapters, and today's tasks to answer questions in **Bangla** and **English**.

---

## Key Features

### 1. Syllabus Universe (`/syllabus`)
- Covers the **NCTB HSC Science curriculum** across Physics 1st & 2nd Paper, Chemistry 1st & 2nd Paper, Higher Mathematics 1st & 2nd Paper, Biology 1st & 2nd Paper, ICT, Bangla 1st & 2nd Paper, and English 1st & 2nd Paper.
- **Two Interactive Views**:
  - **Roadmap & Checkpoint View** (inspired by `developer-roadmap`): Interactive chapter nodes with 6 granular activity checkboxes per chapter.
  - **Proportional Weight Treemap**: Visualizes the true workload weight (`1–15` heuristic effort scale) of every chapter so students can *feel* the weight of Organic Chemistry, Newtonian Mechanics, or Calculus relative to shorter chapters.
- **Sticky Chapter Inspector Drawer**: Edit effort weights, adjust self-reported confidence, toggle checkpoints, launch a chapter quiz, or open curated Bangla HSC YouTube tutorials.

### 2. AI Study Planner & Syllabus Extraction (`/planner`)
- **3 Input Modes**:
  1. Select chapters directly from the HSC Science syllabus.
  2. Paste or type an exam routine / syllabus text (English or Bangla).
  3. Upload a syllabus image or PDF for server-side Gemini multimodal extraction.
- **Mandatory Human Confirmation Step**: Extracted chapters, topics, priorities, and estimated study durations are displayed in an editable review screen before generating a schedule.
- **Subject-Appropriate Task Breakdown**: Generates `Learn Basics`, `Review Formulas`, `Solve MCQs`, and `Solve CQs` for STEM chapters, or passage/grammar/writing drills for Bangla & English.
- **Feasibility Warning & Rebalance**: Alerts the student if required hours exceed available daily study hours before the exam date, and supports 1-click schedule rebalancing while preserving completed tasks.

### 3. Diagnostic & Mock Test Center (`/tests`)
- Inspired by Bangladeshi exam platforms like **Chorcha** and **Daricomma**.
- Supports **Diagnostic Assessment ("Assess My Prep")**, **Chapter Checkpoint**, **Subject-wise Mock**, and **Mixed Syllabus Mock**.
- Features a live countdown timer, question navigation palette, question flagging, instant grading, **Limited-Evidence Warnings** on small question samples, topic-by-topic accuracy breakdown, step-by-step explanations, and a 1-click **"Inject Targeted Revision Tasks into Study Plan"** button.

### 4. Contextual AI Study Mentor (`/mentor`)
- Answers conceptual and strategic study questions in **Bangla** and **English**.
- Displays a live **Student Context Sidebar** showing the exact data injected into the mentor prompt.
- Includes interactive action buttons (`Start Quiz`, `Open Today's Study Tasks`, `Explore Syllabus Universe`, `Generate Targeted Revision Plan`).

### 5. Evidence-Based Progress Analytics (`/analytics`)
- Built with **Recharts** to compare **Task Completion %** vs. **Demonstrated Test Mastery %** by subject, visualize chapter status distribution, and highlight gaps between self-reported confidence and test-verified mastery.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling & UI**: Tailwind CSS, Lucide Icons, Framer Motion
- **Data Visualization**: Custom Interactive Proportional Weight Treemap, Developer-Roadmap Checkpoint Grid, Recharts
- **AI Backend**: Google Gemini API (`@google/generative-ai`) exclusively via server-side API routes (`/api/ai/extract-syllabus`, `/api/ai/generate-plan`, `/api/ai/generate-questions`, `/api/ai/mentor`) with Zod schema validation and resilient NCTB curriculum fallbacks
- **Database & Auth**: Supabase PostgreSQL schema + RLS policies (`supabase/migrations/0001_hscbuddy_schema.sql`) + automatic local persistence for instant zero-config Hackathon Demo mode

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Set your server-side keys in `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash

# Optional: Supabase persistence (falls back to local state automatically if omitted)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: YouTube Data API v3 (falls back to curated Bangla HSC YouTube search links if omitted)
YOUTUBE_API_KEY=your_youtube_api_key
```

### 3. Run Database Migration (Optional for Supabase Cloud)
Run the SQL migration in [`supabase/migrations/0001_hscbuddy_schema.sql`](./supabase/migrations/0001_hscbuddy_schema.sql) inside the Supabase SQL Editor to create all 15 relational tables and Row-Level Security (RLS) policies.

### 4. Start the Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Live Hackathon Demo Walkthrough (8-Step Flow)

1. **Launch Demo Student**: Click **"Launch Hackathon Demo Student"** on the landing page (`/`) or top navigation bar to load `Tahmid Hasan (Demo Sample)`.
2. **Explore Syllabus Universe (`/syllabus`)**: Switch between the **Roadmap & Checkpoint View** and **Proportional Weight Treemap**. Click any chapter (e.g., *Newtonian Mechanics* or *Organic Chemistry*) to inspect its weight, completion %, and test mastery %.
3. **Update Checkpoints**: Check off an activity in the Chapter Inspector and watch the chapter completion % and overall dashboard stats update immediately.
4. **Upload/Extract Syllabus & Generate Study Plan (`/planner`)**: Click **"Create / Upload New Plan"**, paste a custom exam routine or upload a syllabus image/PDF, verify the extracted chapters on the human review screen, and confirm to generate a day-by-day schedule.
5. **Watch Curated Bangla Tutorials**: Click any **"Watch Bangla Tutorial"** button on a study task or chapter drawer to open topic-specific YouTube lessons.
6. **Take a Diagnostic Mock Test (`/tests`)**: Start a 5-question Diagnostic Assessment, submit your answers, and inspect the topic accuracy report.
7. **Trigger Adaptive Revision**: Click **"Inject Targeted Revision Tasks into Study Plan"** on the test results screen and see your chapter mastery update in `/syllabus` and new recovery tasks appear in `/planner`.
8. **Ask the AI Study Mentor (`/mentor`)**: Click *"Explain vectors in Bangla"* or *"Why am I weak in Newtonian Mechanics?"* to receive personalized, bilingual guidance grounded in your real-time learning profile.

