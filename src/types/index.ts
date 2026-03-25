export interface Candidate {
  id: string;
  user_id: string;
  full_name: string;
  applied_position: string;
  status: 'New' | 'Interviewing' | 'Hired' | 'Rejected';
  resume_url?: string;
  created_at: string;
}

export interface AnalyticsStats {
  totalCandidates: number;
  statusRatios: Record<string, number>;
  topPositions: { position: string; count: number }[];
  newCandidatesLast7Days: number;
}
