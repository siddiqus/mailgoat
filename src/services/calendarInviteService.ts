import axios from 'axios'
import { Settings } from '../types/models'
import timezones from '../utils/timezones.json'

// const sampleBody = {
//   subject: 'custom invite',
//   to: 'Fowzia.Sinthiya@optimizely.com',
//   message: 'Here is an automated invite.',
//   startTime: '2025-12-08T16:00:00',
//   endTime: '2025-12-08T17:00:00',
//   timezone: 'Bangladesh Standard Time',
//   attachmentName: '',
//   attachment: '',
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

export async function sendCalendarInvite(
  settings: Settings,
  calendarInviteBody: WebhookRequestBase & {
    attachment?: {
      name: string
      fileBase64: string
    }
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

  const { attachment, ...requestBody } = calendarInviteBody

  const requestWithAttachment: WebhookRequestBase & {
    attachmentName?: string
    attachment?: string
  } = {
    ...requestBody,
  }
  if (attachment) {
    requestWithAttachment.attachmentName = attachment.name
    requestWithAttachment.attachment = attachment.fileBase64
  }

  await axios.post(settings.calendarWebhook?.url, calendarInviteBody, {
    headers,
  })
}
