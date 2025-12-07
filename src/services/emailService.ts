import axios from 'axios'
import LocalStorageSettingsRepository from '../repositories/LocalStorageSettingsRepository'
import { parseEmailList } from '../utils/emailUtils'
import { getTrackingPixelUrl } from './analyticsService'
import { incrementCampaignEmailCount } from './campaignService'
import {
  saveToHistory,
  generateEmailId,
  createPendingHistoryRecord,
  updateHistoryStatus,
} from './emailHistoryService'
import { replaceParameters } from './templateService'
import type {
  EmailData,
  Template,
  EmailSendOptions,
  BulkEmailResult,
  Settings,
  WebhookHeader,
  BodyMapping,
} from '../types/models'

const settingsRepository = new LocalStorageSettingsRepository()

interface DataRow {
  recipient: string
  cc?: string
  [key: string]: string | undefined
}

/**
 * Add tracking pixel to HTML body
 * @param params - Parameters object
 * @param params.htmlBody - The HTML body content
 * @param params.recipient - The recipient email address
 * @param params.emailId - The unique email ID
 * @param params.templateId - The template ID (optional)
 * @param params.campaignId - The campaign ID (optional)
 * @param params.supabaseUrl - The base url for supabase
 * @returns HTML with tracking pixel appended
 */
const addTrackingPixel = ({
  htmlBody,
  recipient,
  emailId,
  templateId,
  campaignId,
  supabaseUrl,
}: {
  htmlBody: string
  recipient: string
  emailId: string
  templateId?: string
  campaignId?: string
  supabaseUrl?: string
}): string => {
  if (!supabaseUrl) {
    return htmlBody
  }

  const trackingPixelUrl = getTrackingPixelUrl({
    emailId,
    campaignId,
    templateId: templateId || '',
    recipient,
    supabaseUrl,
  })

  const trackingPixel = `\n<img src="${trackingPixelUrl}" width="10" height="10" style="display:none;"/>`
  return htmlBody + trackingPixel
}

/**
 * Apply body mapping to email data based on webhook configuration
 * @param emailData - Email data with recipients, ccList, subject, htmlBody
 * @param bodyMapping - Mapping configuration from settings (property name mappings)
 * @returns Mapped email data
 */
export const applyBodyMapping = (
  emailData: EmailData,
  bodyMapping: BodyMapping
): Record<string, string> => {
  const mappedBody: Record<string, string> = {}

  // Map each email field to its configured property name
  if (bodyMapping.recipients && bodyMapping.recipients.length > 0) {
    mappedBody[bodyMapping.recipients] = emailData.recipients.join(';')
  } else {
    throw new Error('No recipients provided')
  }
  if (bodyMapping.ccList && bodyMapping.ccList.length > 0) {
    mappedBody[bodyMapping.ccList] = (emailData.ccList || []).join(';')
  } else {
    mappedBody[bodyMapping.ccList] = ''
  }
  if (bodyMapping.subject) {
    mappedBody[bodyMapping.subject] = emailData.subject
  }
  if (bodyMapping.htmlBody) {
    mappedBody[bodyMapping.htmlBody] = emailData.htmlBody || emailData.htmlString || ''
  }

  return mappedBody
}

/**
 * Send a single email using configured webhook
 * @param emailData - Email data with recipients, ccList, subject, htmlBody
 * @param options - Additional options (template, signal, campaignId)
 * @returns Response from webhook
 */
export const sendSingleEmail = async (
  emailData: EmailData,
  options: EmailSendOptions = {}
): Promise<EmailData> => {
  // Use existing email ID if provided, otherwise generate a new one
  const emailId = emailData.id || generateEmailId()

  // Load settings to get tracking URL and webhook config
  const settings = (await settingsRepository.getSettings()) as Settings

  // Extract templateId from options.template or options.templateId
  const templateId = options.template?.id || options.templateId

  // Add tracking pixel to HTML body for the first recipient (only if pixel tracking is enabled)
  const primaryRecipient = emailData.recipients[0]
  const pixelTrackingEnabled = settings.pixelTracking?.enabled ?? true
  const htmlBodyWithTracking = pixelTrackingEnabled
    ? addTrackingPixel({
        htmlBody: emailData.htmlBody || emailData.htmlString || '',
        recipient: primaryRecipient,
        emailId: emailId,
        templateId: templateId,
        campaignId: options.campaignId || undefined,
        supabaseUrl: settings.supabase?.url,
      })
    : emailData.htmlBody || emailData.htmlString || ''

  // Create modified email data with tracking pixel
  const emailDataWithTracking: EmailData = {
    ...emailData,
    htmlBody: htmlBodyWithTracking,
  }

  if (!settings.webhook.url) {
    throw new Error('Webhook URL not configured. Please configure it in Settings.')
  }

  // Apply body mapping from settings
  const mappedBody = applyBodyMapping(emailDataWithTracking, settings.webhook.bodyMapping)

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add custom headers from settings
  settings.webhook.headers.forEach(header => {
    if (header.key.trim() !== '') {
      headers[header.key] = header.value
    }
  })

  const config: {
    headers: Record<string, string>
    timeout: number
    signal?: AbortSignal
  } = {
    headers,
    timeout: 30000, // 30 second timeout
  }

  if (options.signal) {
    config.signal = options.signal
  }

  await axios.post(settings.webhook.url, mappedBody, config)

  return {
    ...emailData,
    id: emailId,
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Send a single email with outbox pattern (creates pending record, sends, then updates to sent)
 * @param emailData - Email data with recipients, ccList, subject, htmlBody
 * @param options - Additional options (template, signal, campaignId)
 * @param historyId - History record ID to update
 * @returns void
 */
export const sendEmailWithOutbox = async (
  emailData: EmailData,
  options: EmailSendOptions = {},
  historyId: string | null = null
): Promise<void> => {
  try {
    // Send the email
    await sendSingleEmail(emailData, options)

    // Update status to 'sent' if historyId is provided
    if (historyId) {
      await updateHistoryStatus(historyId, 'sent')

      // Increment campaign email count if campaignId is provided
      if (emailData.campaignId) {
        try {
          await incrementCampaignEmailCount(emailData.campaignId)
        } catch (error) {
          console.error('Failed to increment campaign email count:', error)
        }
      }
    }
  } catch (error) {
    // Update status to 'failed' if historyId is provided
    if (historyId) {
      await updateHistoryStatus(historyId, 'failed')
    }
    throw error
  }
}

/**
 * Send bulk emails using outbox pattern (non-blocking)
 * Creates pending records first, then sends emails asynchronously
 * @param bulkEmailData - Array of email data objects
 * @param options - Additional options (template, campaignId)
 * @returns Array of created history record IDs
 */
export const sendBulkEmailsAsync = async (
  bulkEmailData: EmailData[],
  options: EmailSendOptions = {}
): Promise<string[]> => {
  const historyIds: string[] = []

  bulkEmailData.forEach(email => {
    email.id = generateEmailId()
  })

  // First, create all pending history records
  for (const emailData of bulkEmailData) {
    const emailDataWithId: EmailData = {
      ...emailData, // contains id
      campaignId: options.campaignId || null,
    }

    try {
      const historyRecord = await createPendingHistoryRecord(
        emailDataWithId,
        options.template as Template
      )
      historyIds.push(historyRecord.id)
    } catch (error) {
      console.error('Failed to create pending history record:', error)
    }
  }

  // Send emails asynchronously in the background
  sendBulkEmailsInBackground(bulkEmailData, options, historyIds)

  return historyIds
}

/**
 * Background worker to send bulk emails (runs asynchronously)
 * @param bulkEmailData - Array of email data objects
 * @param options - Additional options (template, campaignId)
 * @param historyIds - Array of history record IDs
 */
const sendBulkEmailsInBackground = async (
  bulkEmailData: EmailData[],
  options: EmailSendOptions,
  historyIds: string[]
): Promise<void> => {
  for (let i = 0; i < bulkEmailData.length; i++) {
    const emailData: EmailData = {
      ...bulkEmailData[i],
      campaignId: options.campaignId || null, // Add campaignId to each email data
    }
    const historyId = historyIds[i]

    // Check if operation was cancelled
    if (options.signal && options.signal.aborted) {
      console.log('Bulk email send cancelled')
      break
    }

    try {
      await sendEmailWithOutbox(emailData, options, historyId)
      await sleep(1000) // Rate limiting
    } catch (error) {
      console.error('Error sending email in background:', error)
      // Continue with next email even if one fails
    }
  }
}

/**
 * Send bulk emails using configured webhook (legacy synchronous method)
 * @param bulkEmailData - Array of email data objects
 * @param options - Additional options (templateName, template, campaignId)
 * @returns Response from webhook with campaignId
 */
export const sendBulkEmails = async (
  bulkEmailData: EmailData[],
  options: EmailSendOptions = {}
): Promise<BulkEmailResult> => {
  const results: BulkEmailResult = {
    success: [],
    failures: [],
    campaignId: options.campaignId || null, // Include campaignId in results
  }

  for (const emailData of bulkEmailData) {
    // Check if operation was cancelled
    if (options.signal && options.signal.aborted) {
      throw new Error('Operation cancelled')
    }

    try {
      await sendSingleEmail(emailData, options)

      // Save to history after successful send
      try {
        await saveToHistory(emailData, options.template as Template)
      } catch (historyError) {
        console.error('Failed to save email to history:', historyError)
      }

      results.success.push(emailData.recipients)
      await sleep(1000)
    } catch (error) {
      if (
        (error as Error).name === 'CanceledError' ||
        (error as Error).message === 'Operation cancelled'
      ) {
        throw error // Re-throw cancellation errors
      }
      results.failures.push(emailData.recipients)
    }
  }

  return results
}

/**
 * Test webhook with sample data
 * @param webhookUrl - Webhook URL
 * @param webhookHeaders - Custom headers
 * @param bodyMapping - Body mapping configuration
 * @returns Test result
 */
export const testWebhook = async (
  webhookUrl: string,
  webhookHeaders: WebhookHeader[],
  bodyMapping: BodyMapping
): Promise<{ ok: boolean; status: number; data: unknown }> => {
  const testPayload: EmailData = {
    recipients: ['test@example.com'],
    ccList: ['cc@example.com'],
    subject: 'Test Email Subject',
    htmlBody: '<p>This is a test email body</p>',
  }

  // Apply body mapping
  const mappedBody = applyBodyMapping(testPayload, bodyMapping)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add custom headers
  webhookHeaders.forEach(header => {
    if (header.key.trim() !== '') {
      headers[header.key] = header.value
    }
  })

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(mappedBody),
  })

  return {
    ok: response.ok,
    status: response.status,
    data: response.ok ? await response.json() : null,
  }
}

/**
 * Prepare bulk email data from data rows and template
 * @param dataRows - Data rows
 * @param template - Email template
 * @returns Bulk email data
 */
export const prepareBulkEmailData = (dataRows: DataRow[], template: Template): EmailData[] => {
  return dataRows.map(row => {
    const emailSubject = replaceParameters(template.subject || '', row as Record<string, string>)
    const emailBody = replaceParameters(template.htmlString || '', row as Record<string, string>)

    const recipientList = parseEmailList(row.recipient)

    const ccListArray = parseEmailList(row.cc || '')

    return {
      recipients: recipientList,
      ccList: ccListArray,
      subject: emailSubject,
      htmlString: emailBody,
    }
  })
}
