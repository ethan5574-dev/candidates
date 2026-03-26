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
  job_title: string;
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

    const supabaseClient: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Join with jobs to get titles
    const { data: candidates, error: fetchError } = await supabaseClient
      .from('candidates')
      .select('*, jobs(title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    const totalCandidates = candidates?.length || 0;

    const statusRatios = (candidates || []).reduce((acc: StatusRatios, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});

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

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCandidates = (candidates || [])
      .filter(c => new Date(c.created_at) >= sevenDaysAgo)
      .slice(0, 8)
      .map(c => ({
        id: c.id,
        full_name: c.full_name,
        job_title: c.jobs?.title || 'General',
        status: c.status,
        created_at: c.created_at
      }));

    const positionMap: Record<string, number> = {};
    candidates?.forEach(c => {
      const title = c.jobs?.title || 'General';
      positionMap[title] = (positionMap[title] || 0) + 1;
    });
    
    const topPositions = Object.entries(positionMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([position, count]) => ({ position, count }));

    return new Response(JSON.stringify({
      totalCandidates,
      statusRatios,
      recentCandidates,
      weeklyActivity,
      topPositions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: Error | unknown) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
