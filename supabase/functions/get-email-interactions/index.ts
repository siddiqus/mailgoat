import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const responseHeaders = { ...corsHeaders, 'Content-Type': 'application/json' }

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse query parameters from the URL
    const url = new URL(req.url)
    const campaignId = url.searchParams.get('campaignId')
    const templateId = url.searchParams.get('templateId')

    if (!campaignId && !templateId) {
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch email interactions',
          details: 'At least one of campaignId or templateId must be provided',
        }),
        {
          status: 400,
          headers: responseHeaders,
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Build query based on provided parameters
    let query = supabase.from('email_interactions').select('*')

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch email interactions',
          details: error.message,
        }),
        {
          status: 500,
          headers: responseHeaders,
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data || [],
        count: data?.length || 0,
      }),
      {
        status: 200,
        headers: responseHeaders,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: responseHeaders,
      }
    )
  }
})
