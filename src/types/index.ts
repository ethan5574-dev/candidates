export interface Skill {
  id: string;
  skill_name: string;
  created_at: string;
}

export interface JobSkill {
  skill_name: string;
  weight: number;
}

export interface Job {
  id: string;
  user_id: string;
  title: string;
  description: string;
  skills: JobSkill[];
  created_at: string;
}

export interface Candidate {
  id: string;
  user_id: string;
  job_id: string;
  full_name: string;
  status: 'New' | 'Interviewing' | 'Hired' | 'Rejected';
  resume_url?: string;
  skills: string[];
  match_score?: number;
  created_at: string;
}

export interface RecentCandidate {
  id: string;
  full_name: string;
  job_title: string;
  status: string;
  created_at: string;
}

export interface AnalyticsStats {
  totalCandidates: number;
  statusRatios: Record<string, number>;
  recentCandidates: RecentCandidate[];
  weeklyActivity: { name: string; count: number }[];
  topPositions: { position: string; count: number }[];
}

export interface ToastType {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
