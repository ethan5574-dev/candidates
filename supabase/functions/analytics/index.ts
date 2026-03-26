import { createClient, SupabaseClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface AnalyticsResult {
  totalCandidates: number;
  statusRatios: Record<string, number>;
  topPositions: { position: string; count: number }[];
  newCandidatesLast7Days: number;
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

    console.log('Request Method:', req.method);
    console.log('Authorization Header:', req.headers.get('Authorization') ? 'Present (len: ' + req.headers.get('Authorization')?.length + ')' : 'Missing');
    
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log('Project URL:', url ? 'Set' : 'Missing');
    console.log('Anon Key:', anonKey ? 'Set' : 'Missing');

    const supabaseClient: SupabaseClient = createClient(
      url ?? '',
      anonKey ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      console.error('Auth User Error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized: ' + (userError?.message || 'No user found') }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }
    
    console.log('Authenticated User:', user.id);

    // 1. Total candidates
    const { count: totalCandidates, error: countError } = await supabaseClient
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) throw countError

    // 2. Status ratios
    const { data: statusData, error: statusError } = await supabaseClient
      .from('candidates')
      .select('status')
      .eq('user_id', user.id)

    if (statusError) throw statusError

    const statusRatios = (statusData as { status: string }[]).reduce((acc: Record<string, number>, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1
      return acc
    }, {})

    // 3. Top positions (Algorithm 2 requirement)
    const { data: positionData, error: positionError } = await supabaseClient
      .from('candidates')
      .select('applied_position')
      .eq('user_id', user.id)

    if (positionError) throw positionError

    const posCounts = (positionData as { applied_position: string }[]).reduce((acc: Record<string, number>, curr) => {
      acc[curr.applied_position] = (acc[curr.applied_position] || 0) + 1
      return acc
    }, {})

    const topPositions = Object.entries(posCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([position, count]) => ({ position, count }))

    // 4. New in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: newCount, error: newError } = await supabaseClient
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())

    if (newError) throw newError

    const analytics: AnalyticsResult = {
      totalCandidates: totalCandidates || 0,
      statusRatios,
      topPositions,
      newCandidatesLast7Days: newCount || 0
    }

    return new Response(JSON.stringify(analytics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
