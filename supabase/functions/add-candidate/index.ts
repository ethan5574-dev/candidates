import { createClient, SupabaseClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface JobSkill {
  skill_name: string;
  weight: number;
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

    const { full_name, job_id, resume_url, skills } = await req.json()

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    if (!full_name || !job_id) {
      throw new Error('Full name and job selection are required.')
    }

    // 1. Calculate weighted matching score
    let match_score = 0;
    const candidateSkills = Array.isArray(skills) ? (skills as string[]) : [];

    const { data: job, error: jobError } = await supabaseClient
      .from('jobs')
      .select('skills')
      .eq('id', job_id)
      .single();
    
    if (!jobError && job && job.skills && Array.isArray(job.skills)) {
      const jobRequirements = job.skills as JobSkill[];
      if (jobRequirements.length > 0) {
        let totalPossibleWeight = 0;
        let matchedWeight = 0;

        jobRequirements.forEach(req => {
          const weight = Number(req.weight) || 0;
          totalPossibleWeight += weight;
          
          if (candidateSkills.some(s => s.toLowerCase() === req.skill_name.toLowerCase())) {
            matchedWeight += weight;
          }
        });

        if (totalPossibleWeight > 0) {
          match_score = (matchedWeight / totalPossibleWeight) * 100;
        }
      }
    }

    // 2. Insert candidate
    const { data, error } = await supabaseClient
      .from('candidates')
      .insert({
        user_id: user.id,
        full_name,
        job_id,
        resume_url: resume_url || null,
        status: 'New',
        skills: candidateSkills,
        match_score: Math.round(match_score)
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify(data), {
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
