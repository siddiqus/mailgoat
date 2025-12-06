// This module is deprecated. Please use fileParsingService.js instead.
// Kept for backward compatibility.

import { validateDataRows, parseCSVFile as parseCSV } from './fileParsingService'

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
