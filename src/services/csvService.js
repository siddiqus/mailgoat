import Papa from 'papaparse'
import { parseEmailList } from './templateService'

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate CSV data against template parameters
 * @param {Array} data - Parsed CSV data
 * @param {Array} templateParams - Template parameters
 * @returns {Array} Array of error messages
 */
export const validateCSVData = (data, templateParams) => {
  const errors = []

  if (data.length === 0) {
    errors.push('CSV file is empty')
    return errors
  }

  const headers = Object.keys(data[0])

  // Check for recipient column (required)
  if (!headers.includes('recipient')) {
    errors.push('Missing required column: recipient')
  }

  // Check for template parameter columns
  const missingParams = (templateParams || []).filter(param => !headers.includes(param))
  if (missingParams.length > 0) {
    errors.push(`Missing template parameter columns: ${missingParams.join(', ')}`)
  }

  // Validate each row
  data.forEach((row, index) => {
    const rowNum = index + 2 // +2 because index starts at 0 and we have header row

    // Check if recipient is provided
    if (!row.recipient || row.recipient.trim() === '') {
      errors.push(`Row ${rowNum}: Missing recipient email`)
    } else {
      // Parse multiple recipients (separated by comma or semicolon)
      const recipients = parseEmailList(row.recipient)

      if (recipients.length === 0) {
        errors.push(`Row ${rowNum}: No valid recipient emails found`)
      } else {
        // Validate each recipient email
        recipients.forEach((email) => {
          if (!isValidEmail(email)) {
            errors.push(`Row ${rowNum}: Invalid recipient email format "${email}"`)
          }
        })
      }
    }

    // Validate CC if provided (can also have multiple emails)
    if (row.cc && row.cc.trim() !== '') {
      const ccEmails = parseEmailList(row.cc)

      ccEmails.forEach((email) => {
        if (!isValidEmail(email)) {
          errors.push(`Row ${rowNum}: Invalid CC email format "${email}"`)
        }
      })
    }

    // Check for missing parameter values
    (templateParams || []).forEach(param => {
      if (!row[param] || row[param].trim() === '') {
        errors.push(`Row ${rowNum}: Missing value for parameter "${param}"`)
      }
    })
  })

  return errors
}

/**
 * Parse CSV file
 * @param {File} file - CSV file
 * @returns {Promise<Object>} Parsed data and errors
 */
export const parseCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data.filter(row => {
          // Filter out empty rows
          return Object.values(row).some(val => val && val.trim() !== '')
        })
        resolve(data)
      },
      header: true,
      skipEmptyLines: true,
      error: (error) => {
        reject(error)
      }
    })
  })
}

/**
 * Prepare bulk email data from CSV rows and template
 * @param {Array} csvData - CSV data rows
 * @param {Object} template - Email template
 * @param {Function} replaceParameters - Function to replace parameters
 * @returns {Array} Bulk email data
 */
export const prepareBulkEmailData = (csvData, template, replaceParameters) => {
  return csvData.map(row => {
    const emailSubject = replaceParameters(template.subject || '', row)
    const emailBody = replaceParameters(template.htmlString || '', row)

    // Parse multiple recipients (separated by comma or semicolon)
    const recipientList = parseEmailList(row.recipient)

    // Parse multiple CC emails (separated by comma or semicolon)
    const ccListArray = row.cc && row.cc.trim()
      ? parseEmailList(row.cc)
      : []

    return {
      recipients: recipientList,
      ccList: ccListArray,
      subject: emailSubject,
      htmlString: emailBody
    }
  })
}
