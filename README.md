# 🚀 Candidate Management Mini-App

A structured, professional HR recruitment platform built with **React 19**, **TypeScript**, **Tailwind CSS 4**, and **Supabase**. This application allows HR teams to manage a global skill directory, create job roles with weighted requirements, and track candidates with an AI-driven matching algorithm.

## ✨ Key Features

### 1. Relational HR Workflow
- **Global Skill Directory**: Manage a centralized catalog of skills used across the organization.
- **Job Role Builder**: Create jobs with specific skill requirements and assign **Weights** (importance) to each skill.
- **Linked Candidates**: Candidates are linked directly to job roles, ensuring a clean recruitment pipeline.

### 2. Algorithmic Intelligence
- **Weighted Match Score**: Backend Edge Functions calculate a candidate's fit based on the job's specific skill weights.
- **AI Recommendations**: Get a quick list of top-performing candidates for any specific role using the `recommend` Edge Function.
- **Parallel CV Upload**: Support for uploading multiple resumes simultaneously with an optimized concurrency limit (3) to prevent UI freezing.

### 3. Modern UI/UX
- **Real-time Synchronization**: Database changes (new candidates, status updates) reflect instantly across all connected clients.
- **Interactive Analytics**: Dedicated dashboard with charts and statistics showing recruitment performance.
- **Premium Aesthetics**: Glassmorphism design system using Tailwind 4, Framer Motion animations, and custom UI components (Dropdowns, Toasts, Skeletons).

---

## 🏗️ Database Architecture (Supabase)

The project uses a relational schema with Row Level Security (RLS) to ensure data privacy:

- **`skills`**: Global list of skill names.
- **`jobs`**: Contains `title`, `description`, and a `skills` JSONB field (array of `{skill_name, weight}`).
- **`candidates`**: Links to `jobs` and stores candidate `full_name`, `skills` (JSONB), `resume_url`, and the calculated `match_score`.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase CLI (`npx supabase`)

### Installation
1. **Clone & Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create a `.env` file in the root and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Database Migration**:
   Push the schema and migrations to your Supabase project:
   ```bash
   npx supabase db push
   ```

4. **Deploy Edge Functions**:
   ```bash
   npx supabase functions deploy add-candidate --no-verify-jwt
   npx supabase functions deploy recommend --no-verify-jwt
   npx supabase functions deploy analytics --no-verify-jwt
   ```

5. **Run Locally**:
   ```bash
   npm run dev
   ```

---

## 📁 Project Structure
- `/src/components`: UI modules (Job/Skill management, Candidate views).
- `/src/pages`: Auth and Dashboard layouts.
- `/supabase/functions`: Deno-based Edge Functions for heavy logic and security.
- `/supabase/migrations`: SQL scripts for versioned schema updates.

---
*Created with ❤️ for Advanced HR Management.*
