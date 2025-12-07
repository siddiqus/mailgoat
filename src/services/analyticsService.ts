import { getEmailInteractions } from '../utils/supabaseClient'
import type { AnalyticsParams, AnalyticsResult, TrackingPixelParams } from '../types/models'

/**
 * Get email interactions analytics from Supabase using the JS client
 * @param params - Query parameters
 * @param params.campaignId - Campaign ID to filter by
 * @param params.templateId - Template ID to filter by
 * @returns Analytics result with success status, data and count
 */
export async function getEmailAnalytics({
  campaignId,
  templateId,
}: AnalyticsParams): Promise<AnalyticsResult> {
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
 * @param params - Pixel parameters
 * @param params.emailId - Email ID
 * @param params.templateId - Template ID
 * @param params.recipient - Recipient email
 * @param params.campaignId - Campaign ID
 * @param params.supabaseUrl - Supabase URL
 * @returns The tracking pixel URL
 */
export function getTrackingPixelUrl({
  emailId,
  campaignId,
  templateId,
  recipient,
  supabaseUrl,
}: TrackingPixelParams): string {
  // Build query parameters
  const params = new URLSearchParams()
  if (emailId) params.append('emailId', emailId)
  if (campaignId) params.append('campaignId', campaignId)
  if (templateId) params.append('templateId', templateId)
  if (recipient) params.append('recipient', recipient)

  return `${supabaseUrl}/functions/v1/store-email-interaction?${params.toString()}`
}
