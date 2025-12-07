import { v4 as uuidv4 } from 'uuid'
import type { Template, CalendarInviteHistoryRecord } from '../types/models'

const STORAGE_KEY = 'MailGoat_calendarInviteHistory'

/**
 * Save a sent calendar invite to history
 */
export const saveCalendarInviteToHistory = async (
  inviteData: {
    recipient: string
    subject: string
    message: string
    startTime: string
    endTime: string
    timezone: string
    attachmentName?: string
  },
  template: Template
): Promise<CalendarInviteHistoryRecord> => {
  const historyRecord: CalendarInviteHistoryRecord = {
    id: uuidv4(),
    templateName: template.name,
    templateId: template.id,
    template,
    recipient: inviteData.recipient,
    subject: inviteData.subject,
    message: inviteData.message,
    startTime: inviteData.startTime,
    endTime: inviteData.endTime,
    timezone: inviteData.timezone,
    attachmentName: inviteData.attachmentName,
    status: 'sent',
    sentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }

  // Get existing history
  const existing = getAllCalendarInviteHistory()

  // Add new record at the beginning
  const updated = [historyRecord, ...existing]

  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

  return historyRecord
}

/**
 * Get all calendar invite history
 */
export const getAllCalendarInviteHistory = (): CalendarInviteHistoryRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error reading calendar invite history:', error)
    return []
  }
}

/**
 * Clear all calendar invite history
 */
export const clearAllCalendarInviteHistory = async (): Promise<void> => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing calendar invite history:', error)
    throw new Error('Failed to clear calendar invite history')
  }
}

/**
 * Get calendar invite history by template ID
 */
export const getCalendarInviteHistoryByTemplateId = (
  templateId: string
): CalendarInviteHistoryRecord[] => {
  const allHistory = getAllCalendarInviteHistory()
  return allHistory.filter(record => record.templateId === templateId)
}
