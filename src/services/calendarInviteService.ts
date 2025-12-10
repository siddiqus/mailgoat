import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { Settings, Template } from '../types/models'
import { parseEmailList } from '../utils/emailUtils'
import timezones from '../utils/timezones.json'
import {
  createPendingCalendarInviteHistoryRecord,
  updateCalendarInviteHistoryStatus,
} from './calendarInviteHistoryService'
import { replaceParameters } from './templateService'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// const sampleBody = {
//   subject: 'custom invite',
//   to: 'Fowzia.Sinthiya@optimizely.com',
//   message: 'Here is an automated invite.',
//   startTime: '2025-12-08T16:00:00',
//   endTime: '2025-12-08T17:00:00',
//   timezone: 'Bangladesh Standard Time',
//   attachments: [
//     {
//       name: '',
//       fileBase64: '',
//     },
//   ],
// }

export type TimezoneType = (typeof timezones)[number]['windowsTime']

interface WebhookRequestBase {
  subject: string
  to: string
  message: string
  startTime: string
  endTime: string
  timezone: TimezoneType
}

export interface CalendarInviteData {
  id?: string
  recipient: string
  cc?: string
  subject: string
  message: string
  startTime: string
  endTime: string
  timezone: TimezoneType
}

export interface DataRow {
  recipient: string
  cc?: string
  [key: string]: string | undefined
}

export async function sendCalendarInvite(
  settings: Settings,
  calendarInviteBody: WebhookRequestBase & {
    attachedFiles?: Array<{
      name: string
      fileBase64: string
    }>
  }
) {
  if (!settings.calendarWebhook?.url) {
    throw new Error('Calendar webhook URL is not configured.')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  for (const header of settings.calendarWebhook?.headers || []) {
    headers[header.key] = header.value
  }

  const { attachedFiles, ...requestBody } = calendarInviteBody

  const requestWithAttachment: WebhookRequestBase & {
    attachmentName?: string
    attachedFiles?: Array<{
      name: string
      fileBase64: string
    }>
  } = {
    ...requestBody,
  }

  requestWithAttachment.attachedFiles = attachedFiles ?? []

  await axios.post(settings.calendarWebhook?.url, requestWithAttachment, {
    headers,
  })
}

/**
 * Prepare bulk calendar invite data from data rows and template
 * @param dataRows - Data rows with calendar invite details
 * @param template - Calendar invite template
 * @param baseDate - Base date for calendar invites
 * @param baseTime - Base time for calendar invites
 * @param duration - Duration in minutes
 * @param timezone - Timezone
 * @returns Bulk calendar invite data
 */
export const prepareBulkCalendarInviteData = (
  dataRows: DataRow[],
  template: Template,
  baseDate: string,
  baseTime: string,
  duration: string,
  timezone: TimezoneType
): CalendarInviteData[] => {
  return dataRows.map(row => {
    // Replace parameters in subject and message
    const paramValues = {
      ...row,
      date: baseDate,
      startTime: baseTime,
      duration,
      timezone,
    }

    const inviteSubject = replaceParameters(
      template.subject || '',
      paramValues as Record<string, string>
    )
    const inviteMessage = replaceParameters(
      template.htmlString || '',
      paramValues as Record<string, string>
    )

    const recipientList = parseEmailList(row.recipient)
    const ccListArray = parseEmailList(row.cc || '')

    return {
      recipient: recipientList[0],
      cc: ccListArray.join(', '),
      subject: inviteSubject,
      message: inviteMessage,
      startTime: row.startTime || '',
      endTime: row.endTime || '',
      timezone: (row.timezone as TimezoneType) || timezone,
    }
  })
}

/**
 * Send bulk calendar invites asynchronously
 * @param bulkInviteData - Array of calendar invite data objects
 * @param template - Template used
 * @returns Array of created history record IDs
 */
export const sendBulkCalendarInvitesAsync = async (
  bulkInviteData: CalendarInviteData[],
  template: Template
): Promise<string[]> => {
  const historyIds: string[] = []

  // Assign IDs to all invites
  bulkInviteData.forEach(invite => {
    invite.id = uuidv4()
  })

  // First, create all pending history records
  for (const inviteData of bulkInviteData) {
    try {
      const historyRecord = await createPendingCalendarInviteHistoryRecord(inviteData, template)
      historyIds.push(historyRecord.id)
    } catch (error) {
      console.error('Failed to create pending history record:', error)
    }
  }

  // Send invites asynchronously in the background
  sendBulkCalendarInvitesInBackground(bulkInviteData, template, historyIds)

  return historyIds
}

/**
 * Background worker to send bulk calendar invites (runs asynchronously)
 * @param bulkInviteData - Array of calendar invite data objects
 * @param template - Template used
 * @param historyIds - Array of history record IDs
 */
const sendBulkCalendarInvitesInBackground = async (
  bulkInviteData: CalendarInviteData[],
  template: Template,
  historyIds: string[]
): Promise<void> => {
  const settings = await import('../repositories/LocalStorageSettingsRepository').then(
    m => new m.default()
  )
  const settingsData = await settings.getSettings()

  for (let i = 0; i < bulkInviteData.length; i++) {
    const inviteData = bulkInviteData[i]
    const historyId = historyIds[i]

    try {
      // Prepare the calendar invite body
      const toEmails = [inviteData.recipient]
      if (inviteData.cc && inviteData.cc.trim()) {
        const ccEmails = parseEmailList(inviteData.cc)
        toEmails.push(...ccEmails)
      }

      const calendarInviteBody = {
        subject: inviteData.subject,
        to: toEmails.join(', '),
        message: inviteData.message,
        startTime: inviteData.startTime,
        endTime: inviteData.endTime,
        timezone: inviteData.timezone,
      }

      await sendCalendarInvite(settingsData, calendarInviteBody)

      // Update history status to sent
      await updateCalendarInviteHistoryStatus(historyId, 'sent')

      await sleep(1000) // Rate limiting
    } catch (error) {
      console.error('Error sending calendar invite in background:', error)
      // Update history status to failed
      await updateCalendarInviteHistoryStatus(
        historyId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }
}

// https://default3ec00d79021a42d4aac8dcb35973df.f2.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c4243fff21d34a229040f41f035a10da/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=MwCxgeI3ULYH37ZxdVb2FbBGNrmLxMhGykI-Wb50EJA
