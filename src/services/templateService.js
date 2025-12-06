/**
 * Replace parameters in text with values
 * @param {string} text - Text containing {{parameter}} placeholders
 * @param {Object} values - Object with parameter values
 * @returns {string} Text with parameters replaced
 */
export const replaceParameters = (text, values) => {
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
 * @param {Object} template - Email template
 * @param {Object} parameterValues - Parameter values
 * @returns {Object} Email data with subject and htmlBody
 */
export const prepareEmailFromTemplate = (template, parameterValues) => {
  const subject = replaceParameters(template.subject || '', parameterValues)
  const htmlBody = replaceParameters(template.htmlString || '', parameterValues)

  return { subject, htmlBody }
}

/**
 * Generate sample CSV content for a template
 * @param {Object} template - Email template
 * @returns {string} CSV content
 */
export const generateSampleCSV = template => {
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
 * @param {string} csvContent - CSV content
 * @param {string} filename - Filename for download
 */
export const downloadCSV = (csvContent, filename) => {
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
