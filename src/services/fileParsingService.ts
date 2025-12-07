import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { isValidEmail, parseEmailList } from '../utils/emailUtils'

type DataRow = Record<string, string>

/**
 * Validate data rows against template parameters
 * @param data - Parsed data rows
 * @param templateParams - Template parameters
 * @returns Array of error messages
 */
export const validateDataRows = (data: DataRow[], templateParams: string[]): string[] => {
  const errors: string[] = []

  if (data.length === 0) {
    errors.push('File is empty')
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
      // Parse recipients (only one is allowed)
      const recipients = parseEmailList(row.recipient)

      if (recipients.length === 0) {
        errors.push(`Row ${rowNum}: No valid recipient email found`)
      } else if (recipients.length > 1) {
        errors.push(`Row ${rowNum}: Only one recipient email is allowed per row`)
      } else {
        // Validate the recipient email
        if (!isValidEmail(recipients[0])) {
          errors.push(`Row ${rowNum}: Invalid recipient email format "${recipients[0]}"`)
        }
      }
    }

    // Validate CC if provided (optional field)
    if (row.cc !== undefined && row.cc !== null && row.cc.trim() !== '') {
      const ccEmails = parseEmailList(row.cc)

      ccEmails.forEach(email => {
        if (!isValidEmail(email)) {
          errors.push(`Row ${rowNum}: Invalid CC email format "${email}"`)
        }
      })
    }

    // Check for missing parameter values
    ;(templateParams || []).forEach(param => {
      if (!row[param] || row[param].trim() === '') {
        errors.push(`Row ${rowNum}: Missing value for parameter "${param}"`)
      }
    })
  })

  return errors
}

/**
 * Parse CSV file
 * @param file - CSV file
 * @returns Parsed data
 */
export const parseCSVFile = (file: File): Promise<DataRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: results => {
        const data = (results.data as DataRow[]).filter(row => {
          // Filter out empty rows
          return Object.values(row).some(val => val && val.trim() !== '')
        })
        resolve(data)
      },
      header: true,
      skipEmptyLines: true,
      error: error => {
        reject(error)
      },
    })
  })
}

/**
 * Parse Excel file (.xlsx, .xls)
 * @param file - Excel file
 * @returns Parsed data
 */
export const parseExcelFile = (file: File): Promise<DataRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convert to JSON (array of objects with headers as keys)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false, // Convert everything to strings
          defval: '', // Default value for empty cells
        }) as DataRow[]

        // Filter out empty rows
        const filteredData = jsonData.filter(row => {
          return Object.values(row).some(val => val && String(val).trim() !== '')
        })

        // Convert all values to strings and trim whitespace
        const cleanedData = filteredData.map(row => {
          const cleanRow: DataRow = {}
          Object.keys(row).forEach(key => {
            cleanRow[key] = String(row[key]).trim()
          })
          return cleanRow
        })

        resolve(cleanedData)
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${(error as Error).message}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * Parse file based on extension (CSV or Excel)
 * @param file - File to parse
 * @returns Parsed data
 */
export const parseFile = async (file: File): Promise<DataRow[]> => {
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.csv')) {
    return await parseCSVFile(file)
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return await parseExcelFile(file)
  } else {
    throw new Error('Unsupported file format. Please upload a CSV or Excel file.')
  }
}
