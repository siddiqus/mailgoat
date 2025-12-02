// This module is deprecated. Please use fileParsingService.js instead.
// Kept for backward compatibility.

import {
  validateDataRows,
  parseCSVFile as parseCSV,
  prepareBulkEmailData as prepareBulkData,
} from './fileParsingService'

/**
 * Validate CSV data against template parameters
 * @deprecated Use validateDataRows from fileParsingService instead
 * @param {Array} data - Parsed CSV data
 * @param {Array} templateParams - Template parameters
 * @returns {Array} Array of error messages
 */
export const validateCSVData = (data, templateParams) => {
  return validateDataRows(data, templateParams)
}

/**
 * Parse CSV file
 * @deprecated Use parseFile from fileParsingService instead
 * @param {File} file - CSV file
 * @returns {Promise<Array>} Parsed data
 */
export const parseCSVFile = file => {
  return parseCSV(file)
}

/**
 * Prepare bulk email data from CSV rows and template
 * @deprecated Use prepareBulkEmailData from fileParsingService instead
 * @param {Array} csvData - CSV data rows
 * @param {Object} template - Email template
 * @param {Function} replaceParameters - Function to replace parameters
 * @returns {Array} Bulk email data
 */
export const prepareBulkEmailData = (csvData, template, replaceParameters) => {
  return prepareBulkData(csvData, template, replaceParameters)
}
