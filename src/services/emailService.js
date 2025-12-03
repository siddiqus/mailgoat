import axios from 'axios'
import LocalStorageSettingsRepository from '../repositories/LocalStorageSettingsRepository'
import { saveToHistory, generateEmailId } from './emailHistoryService'

const settingsRepository = new LocalStorageSettingsRepository()

/**
 * Add tracking pixel to HTML body
 * @param {string} htmlBody - The HTML body content
 * @param {string} recipient - The recipient email address
 * @param {string} emailId - The unique email ID
 * @param {string} campaignId - The campaign ID (optional)
 * @returns {string} HTML with tracking pixel appended
 */
const addTrackingPixel = (htmlBody, recipient, emailId, campaignId = null) => {
  const trackingUrl = 'https://invitingly-spectrographic-leisha.ngrok-free.dev/check'
  let trackingPixelUrl = `${trackingUrl}?recipient=${encodeURIComponent(recipient)}&id=${emailId}`

  // Add campaignId to tracking pixel if provided
  if (campaignId) {
    trackingPixelUrl += `&campaignId=${campaignId}`
  }

  const trackingPixel = `\n<img src="${trackingPixelUrl}" width="1" height="1" />`
  return htmlBody + trackingPixel
}

/**
 * Apply body mapping to email data based on webhook configuration
 * @param {Object} emailData - Email data with recipients, ccList, subject, htmlBody
 * @param {Object} bodyMapping - Mapping configuration from settings (property name mappings)
 * @returns {Object} Mapped email data
 */
export const applyBodyMapping = (emailData, bodyMapping) => {
  const mappedBody = {}

  // Map each email field to its configured property name
  if (bodyMapping.recipients && bodyMapping.recipients.length > 0) {
    mappedBody[bodyMapping.recipients] = emailData.recipients.join(';')
  } else {
    throw new Error('No recipients provided')
  }
  if (bodyMapping.ccList && bodyMapping.ccList.length > 0) {
    mappedBody[bodyMapping.ccList] = emailData.ccList.join(';')
  } else {
    mappedBody[bodyMapping.ccList] = ''
  }
  if (bodyMapping.subject) {
    mappedBody[bodyMapping.subject] = emailData.subject
  }
  if (bodyMapping.htmlBody) {
    mappedBody[bodyMapping.htmlBody] = emailData.htmlBody || emailData.htmlString
  }

  return mappedBody
}

/**
 * Send a single email using configured webhook
 * @param {Object} emailData - Email data with recipients, ccList, subject, htmlBody
 * @param {Object} options - Additional options (template, signal, campaignId)
 * @returns {Promise<Object>} Response from webhook
 */
export const sendSingleEmail = async (emailData, options = {}) => {
  // Generate unique email ID
  const emailId = generateEmailId()

  // Add tracking pixel to HTML body for the first recipient
  const primaryRecipient = emailData.recipients[0]
  const htmlBodyWithTracking = addTrackingPixel(
    emailData.htmlBody || emailData.htmlString,
    primaryRecipient,
    emailId,
    options.campaignId
  )

  // Create modified email data with tracking pixel
  const emailDataWithTracking = {
    ...emailData,
    htmlBody: htmlBodyWithTracking,
    id: emailId,
    campaignId: options.campaignId || null, // Add campaignId for tracking
  }

  // Load webhook settings
  const settings = await settingsRepository.getSettings()

  if (!settings.webhook.url) {
    throw new Error('Webhook URL not configured. Please configure it in Settings.')
  }

  // Apply body mapping from settings
  const mappedBody = applyBodyMapping(emailDataWithTracking, settings.webhook.bodyMapping)

  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
  }

  // Add custom headers from settings
  settings.webhook.headers.forEach(header => {
    if (header.key.trim() !== '') {
      headers[header.key] = header.value
    }
  })

  const config = {
    headers,
    timeout: 30000, // 30 second timeout
  }

  if (options.signal) {
    config.signal = options.signal
  }

  const response = await axios.post(settings.webhook.url, mappedBody, config)

  // Save to history after successful send with the email ID
  try {
    await saveToHistory(emailDataWithTracking, options.template)
  } catch (historyError) {
    console.error('Failed to save email to history:', historyError)
    // Don't fail the email send if history save fails
  }

  return response.data
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Send bulk emails using configured webhook
 * @param {Array<Object>} bulkEmailData - Array of email data objects
 * @param {AbortSignal} signal - Optional abort signal for cancellation
 * @param {Object} options - Additional options (templateName, template, campaignId)
 * @returns {Promise<Object>} Response from webhook with campaignId
 */
export const sendBulkEmails = async (bulkEmailData, options = {}) => {
  const results = {
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
      results.success.push(emailData.recipients)
      await sleep(1000)
    } catch (error) {
      if (error.name === 'CanceledError' || error.message === 'Operation cancelled') {
        throw error // Re-throw cancellation errors
      }
      results.failures.push(emailData.recipients)
    }
  }

  return results
}

/**
 * Test webhook with sample data
 * @param {string} webhookUrl - Webhook URL
 * @param {Array} webhookHeaders - Custom headers
 * @param {Object} bodyMapping - Body mapping configuration
 * @returns {Promise<Object>} Test result
 */
export const testWebhook = async (webhookUrl, webhookHeaders, bodyMapping) => {
  const testPayload = {
    recipients: ['test@example.com'],
    ccList: ['cc@example.com'],
    subject: 'Test Email Subject',
    htmlBody: '<p>This is a test email body</p>',
  }

  // Apply body mapping
  const mappedBody = applyBodyMapping(testPayload, bodyMapping)

  const headers = {
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
