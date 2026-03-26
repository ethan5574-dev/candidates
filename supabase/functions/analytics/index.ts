import { createClient, SupabaseClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface StatusRatios {
  [key: string]: number;
}

interface DailyCount {
  name: string;
  count: number;
}

interface RecentCandidate {
  id: string;
  full_name: string;
  applied_position: string;
  status: string;
  created_at: string;
}

interface AnalyticsResponse {
  totalCandidates: number;
  statusRatios: StatusRatios;
  recentCandidates: RecentCandidate[];
  weeklyActivity: DailyCount[];
  topPositions: { position: string; count: number }[];
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const url = Deno.env.get('SUPABASE_URL') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    const supabaseClient: SupabaseClient = createClient(
      url,
      anonKey,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // 1. Fetch ALL candidates for the user to process stats in-memory (efficient for small/medium datasets)
    const { data: candidates, error: fetchError } = await supabaseClient
      .from('candidates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    // 2. Total Count
    const totalCandidates = candidates?.length || 0;

    // 3. Status Ratios
    const statusRatios = (candidates || []).reduce((acc: StatusRatios, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});

    // 4. Weekly Activity (Last 7 days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyActivity: DailyCount[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const count = candidates?.filter(c => 
        new Date(c.created_at).toDateString() === d.toDateString()
      ).length || 0;
      weeklyActivity.push({ name: dayName, count });
    }

    // 5. Recent Candidates (Spec: "ứng viên mới nhất trong 7 ngày")
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentCandidates = (candidates || [])
      .filter(c => new Date(c.created_at) >= sevenDaysAgo)
      .slice(0, 5);

    // 6. Top Positions
    const positionMap: Record<string, number> = {};
    candidates?.forEach(c => {
      positionMap[c.applied_position] = (positionMap[c.applied_position] || 0) + 1;
    });
    
    const topPositions = Object.entries(positionMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([position, count]) => ({ position, count }));

    const response: AnalyticsResponse = {
      totalCandidates,
      statusRatios,
      recentCandidates: recentCandidates as RecentCandidate[],
      weeklyActivity,
      topPositions
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: Error | unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
