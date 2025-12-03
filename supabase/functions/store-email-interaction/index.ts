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
    const recipient = url.searchParams.get('recipient')
    const emailId = url.searchParams.get('emailId')
    const templateId = url.searchParams.get('templateId')
    const campaignId = url.searchParams.get('campaignId') // nullable

    // Validate required parameters
    if (!recipient || !emailId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters: recipient and emailId are required',
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

    // Insert email interaction into the database
    const { error } = await supabase
      .from('email_interactions')
      .insert({
        email_id: emailId,
        recipient: recipient,
        template_id: templateId,
        campaign_id: campaignId || null,
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({
          error: 'Failed to store email interaction',
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
      }),
      {
        status: 200,
        headers: {
          ...responseHeaders,
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        },
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
