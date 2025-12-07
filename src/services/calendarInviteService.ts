import axios from 'axios'
import { Settings } from '../types/models'
import timezones from '../utils/timezones.json'

// const sampleBody = {
//   subject: 'Weekly Report',
//   to: 'labiba.samara@optimizely.com',
//   message: 'Here is your weekly report.',
//   startTime: '2025-12-07T16:00:00',
//   endTime: '2025-12-07T17:00:00',
//   timezone: 'Bangladesh Standard Time',
// }

export type TimezoneType = (typeof timezones)[number]['windowsTime']

export async function sendCalendarInvite(
  settings: Settings,
  calendarInviteBody: {
    subject: string
    to: string
    message: string
    startTime: string
    endTime: string
    timezone: TimezoneType
  }
) {
  if (!settings.calendarWebhook?.url) {
    throw new Error('Calendar webhook URL is not configured.')
  }
  // const url =
  //   'https://default3ec00d79021a42d4aac8dcb35973df.f2.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c4243fff21d34a229040f41f035a10da/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=MwCxgeI3ULYH37ZxdVb2FbBGNrmLxMhGykI-Wb50EJA'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  for (const header of settings.calendarWebhook?.headers || []) {
    headers[header.key] = header.value
  }

  return await axios.post(settings.calendarWebhook?.url, calendarInviteBody, {
    headers,
  })
}
