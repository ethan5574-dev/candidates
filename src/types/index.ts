export interface Candidate {
  id: string;
  user_id: string;
  full_name: string;
  applied_position: string;
  status: 'New' | 'Interviewing' | 'Hired' | 'Rejected';
  resume_path?: string;
  created_at: string;
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
