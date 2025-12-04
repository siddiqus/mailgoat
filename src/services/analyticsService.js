import { getSupabaseClient } from '../utils/supabaseClient'

/**
 * Get email interactions analytics from Supabase using the JS client
 * @param {Object} params - Query parameters
 * @param {string} [params.campaignId] - Campaign ID to filter by
 * @param {string} [params.templateId] - Template ID to filter by
 * @returns {Promise<{success: boolean, data: Array, count: number}>}
 */
export async function getEmailAnalytics({ campaignId, templateId }) {
  // Validate that at least one filter is provided
  if (!campaignId && !templateId) {
    throw new Error('At least one of campaignId or templateId must be provided')
  }

  const supabase = await getSupabaseClient()

  console.log('Fetching analytics with filters:', { campaignId, templateId })

  // Call the edge function
  const { data, error } = await supabase.functions.invoke('get-email-interactions', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      campaignId,
      templateId,
    }),
  })

  if (error) {
    console.error('Edge function error:', error)
    throw new Error(`Failed to fetch analytics: ${error.message}`)
  }

  // Check if the response contains an error
  if (data?.error) {
    console.error('Edge function returned error:', data.error)
    throw new Error(`Failed to fetch analytics: ${data.details || data.error}`)
  }

  console.log(`Successfully fetched ${data?.count || 0} email interactions`)

  return {
    success: data?.success ?? true,
    data: data?.data || [],
    count: data?.count || 0,
  }
}

/**
 * Store email interaction (for tracking pixel)
 * @param {Object} params - Interaction parameters
 * @param {string} params.emailId - Email ID
 * @param {string} [params.campaignId] - Campaign ID
 * @param {string} [params.templateId] - Template ID
 * @param {string} [params.recipient] - Recipient email
 * @returns {Promise<{success: boolean, data: object}>}
 */
export async function storeEmailInteraction({ emailId, campaignId, templateId, recipient }) {
  try {
    const supabase = await getSupabaseClient()

    console.log('Storing email interaction:', { emailId, campaignId, templateId, recipient })

    const interactionData = {
      email_id: emailId,
      opened_at: new Date().toISOString(),
    }

    if (campaignId) {
      interactionData.campaign_id = campaignId
    }

    if (templateId) {
      interactionData.template_id = templateId
    }

    if (recipient) {
      interactionData.recipient = recipient
    }

    const { data, error } = await supabase
      .from('email_interactions')
      .insert([interactionData])
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      throw new Error(`Failed to store interaction: ${error.message}`)
    }

    console.log('Successfully stored email interaction')

    return {
      success: true,
      data: data?.[0] || {},
    }
  } catch (error) {
    console.error('Error storing email interaction:', error)

    if (error.message.includes('Supabase configuration')) {
      throw error
    }

    throw new Error(`Failed to store interaction: ${error.message}`)
  }
}

/**
 * Get tracking pixel URL for embedding in emails
 * Note: This doesn't use the JS client, just constructs the URL
 * @param {Object} params - Pixel parameters
 * @param {string} params.emailId - Email ID
 * @param {string} params.templateId - Template ID
 * @param {string} params.recipient - Recipient email
 * @param {string} [params.campaignId] - Campaign ID
 * @param {string} [params.supabaseUrl] - Campaign ID
 * @returns {Promise<string>} - The tracking pixel URL
 */
export function getTrackingPixelUrl({ emailId, campaignId, templateId, recipient, supabaseUrl }) {
  // Build query parameters
  const params = new URLSearchParams()
  if (emailId) params.append('emailId', emailId)
  if (campaignId) params.append('campaignId', campaignId)
  if (templateId) params.append('templateId', templateId)
  if (recipient) params.append('recipient', recipient)

  return `${supabaseUrl}/functions/v1/store-email-interaction?${params.toString()}`
}

/**
 * Get all email interactions (no filters)
 * @returns {Promise<{success: boolean, data: Array, count: number}>}
 */
export async function getAllEmailInteractions() {
  try {
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
      .from('email_interactions')
      .select('*')
      .order('opened_at', { ascending: false })

    if (error) {
      console.error('Supabase query error:', error)
      throw new Error(`Failed to fetch interactions: ${error.message}`)
    }

    return {
      success: true,
      data: data || [],
      count: data?.length || 0,
    }
  } catch (error) {
    console.error('Error fetching all email interactions:', error)
    throw new Error(`Failed to fetch interactions: ${error.message}`)
  }
}
