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
export const generateSampleCSV = (template: Template): string => {
  const requiredColumns = ['recipient', 'cc', ...(template.parameters || [])]
  const headers = requiredColumns.join(',')
  const sampleRow = requiredColumns
    .map(col => {
      if (col === 'recipient') return 'user@example.com'
      if (col === 'cc') return 'cc@example.com (optional)'
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
