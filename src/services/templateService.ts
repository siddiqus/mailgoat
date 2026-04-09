import type { Template } from '../types/models'

interface PreparedEmailData {
  subject: string
  htmlBody: string
}

/**
 * Replace parameters in text with values
 * @param text - Text containing {{parameter}} placeholders
 * @param values - Object with parameter values
 * @returns Text with parameters replaced
 */
export const replaceParameters = (text: string, values: Record<string, string>): string => {
  if (!text) return ''
  let result = text
  Object.keys(values).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(regex, values[key] || `{{${key}}}`)
  })
  return result
}

/**
 * Prepare email data from template and parameter values
 * @param template - Email template
 * @param parameterValues - Parameter values
 * @returns Email data with subject and htmlBody
 */
export const prepareEmailFromTemplate = (
  template: Template,
  parameterValues: Record<string, string>
): PreparedEmailData => {
  const subject = replaceParameters(template.subject || '', parameterValues)
  const htmlBody = replaceParameters(template.htmlString || '', parameterValues)

  return { subject, htmlBody }
}

/**
 * Generate sample CSV content for a template
 * @param template - Email template
 * @returns CSV content
 */
export const generateSampleCSV = (
  template: Template,
  options?: { isCalendarInvite?: boolean }
): string => {
  // Calendar invites need per-row date/time/duration/timezone columns
  const calendarColumns = options?.isCalendarInvite ? ['date', 'time', 'duration', 'timezone'] : []
  // Filter out calendar-related params from template parameters to avoid duplication
  const calendarParamNames = ['date', 'startTime', 'endTime', 'timezone', 'durationInMinutes']
  const filteredParams = (template.parameters || []).filter(p => !calendarParamNames.includes(p))
  const columns = ['recipient', 'cc', ...calendarColumns, ...filteredParams]
  const headers = columns.join(',')
  const sampleRow = columns
    .map(col => {
      if (col === 'recipient') return 'user@example.com'
      if (col === 'cc') return '' // CC is optional, leave empty
      if (col === 'date') return '2026-04-15'
      if (col === 'time') return '02:00 PM'
      if (col === 'duration') return '60'
      if (col === 'timezone') return 'Eastern Standard Time'
      return `sample_${col}`
    })
    .join(',')

  return `${headers}\n${sampleRow}`
}

/**
 * Download CSV file
 * @param csvContent - CSV content
 * @param filename - Filename for download
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
