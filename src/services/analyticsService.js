import { getEmailInteractions } from '../utils/supabaseClient'

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

  const data = await getEmailInteractions({ campaign_id: campaignId, template_id: templateId })

  return {
    success: true,
    data: data || [],
    count: data?.length || 0,
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
