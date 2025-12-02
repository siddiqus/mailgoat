import EmailHistoryRepository from '../repositories/EmailHistoryRepository'

const historyRepository = new EmailHistoryRepository()

/**
 * Save a sent email to history
 * @param {Object} emailData - Email data
 * @param {string} templateName - Name of template used (or 'Custom' for no template)
 * @param {Object} template - Template object (optional)
 * @returns {Promise<Object>} Saved history record
 */
export const saveToHistory = async (emailData, template) => {
  const historyRecord = {
    templateName: template.name,
    templateId: template.id,
    template,
    recipients: emailData.recipients,
    ccList: emailData.ccList || [],
    subject: emailData.subject,
    htmlBody: emailData.htmlBody || emailData.htmlString,
    status: 'sent',
  }

  return await historyRepository.create(historyRecord)
}

/**
 * Get all email history
 * @returns {Promise<Array>} Array of email history records
 */
export const getAllHistory = async () => {
  return await historyRepository.getAll()
}

/**
 * Get a single email history record
 * @param {string} id - History record ID
 * @returns {Promise<Object|null>} History record or null
 */
export const getHistoryById = async id => {
  return await historyRepository.getById(id)
}

/**
 * Delete a history record
 * @param {string} id - History record ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
export const deleteHistory = async id => {
  return await historyRepository.delete(id)
}

/**
 * Clear all email history
 * @returns {Promise<void>}
 */
export const clearAllHistory = async () => {
  return await historyRepository.clear()
}
