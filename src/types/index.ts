export interface Candidate {
  id: string;
  user_id: string;
  full_name: string;
  applied_position: string;
  status: string;
  resume_path?: string;
  created_at: string;
  skills?: string[];
  job_id?: string;
  match_score?: number;
}

export interface Job {
  id: string;
  title: string;
  description?: string;
}

export interface AnalyticsStats {
  totalCandidates: number;
  statusRatios: Record<string, number>;
  topPositions: { position: string; count: number }[];
  recentCandidates: {
    id: string;
    full_name: string;
    applied_position: string;
    status: string;
    created_at: string;
  }[];
  weeklyActivity: { name: string; count: number }[];
}
