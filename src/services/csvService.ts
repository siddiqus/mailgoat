// This module is deprecated. Please use fileParsingService.ts instead.
// Kept for backward compatibility.

import { validateDataRows, parseCSVFile as parseCSV } from './fileParsingService'

type DataRow = Record<string, string>

/**
 * Validate CSV data against template parameters
 * @deprecated Use validateDataRows from fileParsingService instead
 * @param data - Parsed CSV data
 * @param templateParams - Template parameters
 * @returns Array of error messages
 */
export const validateCSVData = (data: DataRow[], templateParams: string[]): string[] => {
  return validateDataRows(data, templateParams)
}

/**
 * Parse CSV file
 * @deprecated Use parseFile from fileParsingService instead
 * @param file - CSV file
 * @returns Parsed data
 */
export const parseCSVFile = (file: File): Promise<DataRow[]> => {
  return parseCSV(file)
}
