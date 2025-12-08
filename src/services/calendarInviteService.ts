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

// https://default3ec00d79021a42d4aac8dcb35973df.f2.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c4243fff21d34a229040f41f035a10da/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=MwCxgeI3ULYH37ZxdVb2FbBGNrmLxMhGykI-Wb50EJA
