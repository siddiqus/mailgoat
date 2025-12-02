import LocalStorageSettingsRepository from '../repositories/LocalStorageSettingsRepository'

const settingsRepository = new LocalStorageSettingsRepository()

/**
 * Apply body mapping to email data based on webhook configuration
 * @param {Object} emailData - Email data with recipients, ccList, subject, htmlString
 * @param {Object} bodyMapping - Mapping configuration from settings
 * @returns {Object} Mapped email data
 */
export const applyBodyMapping = (emailData, bodyMapping) => {
  const mappedBody = {}
  Object.keys(bodyMapping).forEach(key => {
    const mapping = bodyMapping[key]
    if (mapping.includes('{{recipients}}')) {
      mappedBody[key] = emailData.recipients
    } else if (mapping.includes('{{ccList}}')) {
      mappedBody[key] = emailData.ccList
    } else if (mapping.includes('{{subject}}')) {
      mappedBody[key] = emailData.subject
    } else if (mapping.includes('{{htmlString}}')) {
      mappedBody[key] = emailData.htmlString
    } else {
      mappedBody[key] = mapping
    }
  })
  return mappedBody
}

/**
 * Send a single email using configured webhook
 * @param {Object} emailData - Email data with recipients, ccList, subject, htmlString
 * @returns {Promise<Object>} Response from webhook
 */
export const sendSingleEmail = async (emailData) => {
  // Load webhook settings
  const settings = await settingsRepository.getSettings()

  if (!settings.webhook.url) {
    throw new Error('Webhook URL not configured. Please configure it in Settings.')
  }

  // Apply body mapping from settings
  const mappedBody = applyBodyMapping(emailData, settings.webhook.bodyMapping)

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

  const response = await fetch(settings.webhook.url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(mappedBody)
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

/**
 * Send bulk emails using configured webhook
 * @param {Array<Object>} bulkEmailData - Array of email data objects
 * @returns {Promise<Object>} Response from webhook
 */
export const sendBulkEmails = async (bulkEmailData) => {
  // Load webhook settings
  const settings = await settingsRepository.getSettings()

  if (!settings.webhook.url) {
    throw new Error('Webhook URL not configured. Please configure it in Settings.')
  }

  // Apply body mapping to each email
  const mappedBulkData = bulkEmailData.map(emailData =>
    applyBodyMapping(emailData, settings.webhook.bodyMapping)
  )

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

  const response = await fetch(settings.webhook.url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ emails: mappedBulkData })
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
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
    htmlString: '<p>This is a test email body</p>'
  }

  // Apply body mapping
  const mappedBody = applyBodyMapping(testPayload, bodyMapping)

  const headers = {
    'Content-Type': 'application/json'
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
    body: JSON.stringify(mappedBody)
  })

  return {
    ok: response.ok,
    status: response.status,
    data: response.ok ? await response.json() : null
  }
}
