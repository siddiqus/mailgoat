import { v4 as uuidv4 } from 'uuid'
import EmailHistoryRepository from '../repositories/EmailHistoryRepository'
import { incrementCampaignEmailCount } from './campaignService'
import type { Template, EmailData, EmailHistoryRecord } from '../types/models'

const historyRepository = new EmailHistoryRepository()

/**
 * Generate a unique email ID
 * @returns UUID for the email
 */
export const generateEmailId = (): string => {
  return uuidv4()
}

/**
 * Save a sent email to history
 * @param emailData - Email data
 * @param template - Template object
 * @returns Saved history record
 */
export const saveToHistory = async (
  emailData: EmailData,
  template: Template
): Promise<EmailHistoryRecord> => {
  const historyRecord = {
    id: emailData.id, // Will be used by repository if provided
    templateName: template.name,
    templateId: template.id,
    template,
    recipients: emailData.recipients,
    ccList: emailData.ccList || [],
    subject: emailData.subject,
    htmlBody: emailData.htmlBody || emailData.htmlString || '',
    status: 'sent' as const,
    campaignId: emailData.campaignId || null, // Include campaignId for tracking
  }

  // Increment campaign email count if campaignId is provided
  if (emailData.campaignId) {
    try {
      await incrementCampaignEmailCount(emailData.campaignId)
    } catch (error) {
      console.error('Failed to increment campaign email count:', error)
      // Don't fail the history save if campaign increment fails
    }
  }

  return await historyRepository.create(historyRecord)
}

/**
 * Create a pending history record (outbox pattern)
 * @param emailData - Email data
 * @param template - Template object
 * @returns Created pending history record
 */
export const createPendingHistoryRecord = async (
  emailData: EmailData,
  template: Template
): Promise<EmailHistoryRecord> => {
  const historyRecord = {
    id: emailData.id, // Will be used by repository if provided
    templateName: template.name,
    templateId: template.id,
    template,
    recipients: emailData.recipients,
    ccList: emailData.ccList || [],
    subject: emailData.subject,
    htmlBody: emailData.htmlBody || emailData.htmlString || '',
    status: 'pending' as const,
    campaignId: emailData.campaignId || null,
  }

  return await historyRepository.create(historyRecord)
}

/**
 * Get all email history
 * @returns Array of email history records
 */
export const getAllHistory = async (): Promise<EmailHistoryRecord[]> => {
  return await historyRepository.getAll()
}

/**
 * Get a single email history record
 * @param id - History record ID
 * @returns History record or null
 */
export const getHistoryById = async (id: string): Promise<EmailHistoryRecord | null> => {
  return await historyRepository.getById(id)
}

/**
 * Delete a history record
 * @param id - History record ID
 * @returns True if deleted successfully
 */
export const deleteHistory = async (id: string): Promise<boolean> => {
  return await historyRepository.delete(id)
}

/**
 * Update email history record status
 * @param id - History record ID
 * @param status - New status ('pending', 'sent', 'failed')
 * @returns Updated record or null
 */
export const updateHistoryStatus = async (
  id: string,
  status: 'pending' | 'sent' | 'failed'
): Promise<EmailHistoryRecord | null> => {
  return await historyRepository.update(id, { status })
}

/**
 * Clear all email history
 * @returns void
 */
export const clearAllHistory = async (): Promise<void> => {
  return await historyRepository.clear()
}
