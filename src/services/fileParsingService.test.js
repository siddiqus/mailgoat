import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateDataRows,
  parseCSVFile,
  parseExcelFile,
  parseFile,
  prepareBulkEmailData,
} from './fileParsingService'

describe('fileParsingService', () => {
  describe('validateDataRows', () => {
    it('should return error when data is empty', () => {
      const errors = validateDataRows([], [])
      expect(errors).toContain('File is empty')
    })

    it('should return error when recipient column is missing', () => {
      const data = [{ name: 'John', email: 'john@test.com' }]
      const errors = validateDataRows(data, ['name'])

      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(err => err.includes('Missing required column: recipient'))).toBe(true)
    })

    it('should return error when template parameter columns are missing', () => {
      const data = [{ recipient: 'john@test.com' }]
      const errors = validateDataRows(data, ['name', 'age'])

      expect(errors.some(err => err.includes('Missing template parameter columns'))).toBe(true)
      expect(errors.some(err => err.includes('name'))).toBe(true)
      expect(errors.some(err => err.includes('age'))).toBe(true)
    })

    it('should validate recipient email format', () => {
      const data = [
        {
          recipient: 'invalid-email',
          name: 'John',
        },
      ]
      const errors = validateDataRows(data, ['name'])

      expect(errors.some(err => err.includes('Invalid recipient email format'))).toBe(true)
    })

    it('should validate multiple recipients', () => {
      const data = [
        {
          recipient: 'valid@test.com, invalid-email',
          name: 'John',
        },
      ]
      const errors = validateDataRows(data, ['name'])

      expect(errors.some(err => err.includes('Invalid recipient email format'))).toBe(true)
    })

    it('should validate CC email format', () => {
      const data = [
        {
          recipient: 'valid@test.com',
          cc: 'invalid-cc',
          name: 'John',
        },
      ]
      const errors = validateDataRows(data, ['name'])

      expect(errors.some(err => err.includes('Invalid CC email format'))).toBe(true)
    })

    it('should check for missing parameter values', () => {
      const data = [
        {
          recipient: 'valid@test.com',
          name: '',
        },
      ]
      const errors = validateDataRows(data, ['name'])

      expect(errors.some(err => err.includes('Missing value for parameter "name"'))).toBe(true)
    })

    it('should return no errors for valid data', () => {
      const data = [
        {
          recipient: 'user1@test.com',
          cc: 'cc1@test.com',
          name: 'John',
          age: '25',
        },
        {
          recipient: 'user2@test.com, user3@test.com',
          cc: '',
          name: 'Jane',
          age: '30',
        },
      ]
      const errors = validateDataRows(data, ['name', 'age'])

      expect(errors.length).toBe(0)
    })

    it('should handle empty CC field', () => {
      const data = [
        {
          recipient: 'valid@test.com',
          cc: '',
          name: 'John',
        },
      ]
      const errors = validateDataRows(data, ['name'])

      expect(errors.length).toBe(0)
    })

    it('should show correct row numbers in errors', () => {
      const data = [
        {
          recipient: 'valid@test.com',
          name: 'John',
        },
        {
          recipient: '',
          name: 'Jane',
        },
      ]
      const errors = validateDataRows(data, ['name'])

      expect(errors.some(err => err.includes('Row 3:'))).toBe(true)
    })
  })

  describe('parseCSVFile', () => {
    it('should parse a valid CSV file', async () => {
      const csvContent = 'recipient,cc,name\nuser@test.com,cc@test.com,John'
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const file = new File([blob], 'test.csv', { type: 'text/csv' })

      const result = await parseCSVFile(file)

      expect(result.length).toBe(1)
      expect(result[0].recipient).toBe('user@test.com')
      expect(result[0].cc).toBe('cc@test.com')
      expect(result[0].name).toBe('John')
    })

    it('should filter out empty rows', async () => {
      const csvContent = 'recipient,cc,name\nuser@test.com,cc@test.com,John\n,,\nuser2@test.com,,Jane'
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const file = new File([blob], 'test.csv', { type: 'text/csv' })

      const result = await parseCSVFile(file)

      expect(result.length).toBe(2)
    })
  })

  describe('parseExcelFile', () => {
    it('should reject unsupported file types for parseFile', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' })
      const file = new File([blob], 'test.txt', { type: 'text/plain' })

      await expect(parseFile(file)).rejects.toThrow('Unsupported file format')
    })
  })

  describe('prepareBulkEmailData', () => {
    const mockReplaceParameters = (text, params) => {
      let result = text
      Object.keys(params).forEach(key => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), params[key])
      })
      return result
    }

    it('should prepare bulk email data from rows', () => {
      const dataRows = [
        {
          recipient: 'user1@test.com',
          cc: 'cc1@test.com',
          name: 'John',
        },
        {
          recipient: 'user2@test.com, user3@test.com',
          cc: '',
          name: 'Jane',
        },
      ]

      const template = {
        subject: 'Hello {{name}}',
        htmlString: '<p>Welcome {{name}}</p>',
      }

      const result = prepareBulkEmailData(dataRows, template, mockReplaceParameters)

      expect(result.length).toBe(2)
      expect(result[0].subject).toBe('Hello John')
      expect(result[0].htmlString).toBe('<p>Welcome John</p>')
      expect(result[0].recipients).toEqual(['user1@test.com'])
      expect(result[0].ccList).toEqual(['cc1@test.com'])

      expect(result[1].subject).toBe('Hello Jane')
      expect(result[1].recipients).toEqual(['user2@test.com', 'user3@test.com'])
      expect(result[1].ccList).toEqual([])
    })

    it('should handle empty CC list', () => {
      const dataRows = [
        {
          recipient: 'user1@test.com',
          cc: '',
          name: 'John',
        },
      ]

      const template = {
        subject: 'Test',
        htmlString: '<p>Test</p>',
      }

      const result = prepareBulkEmailData(dataRows, template, mockReplaceParameters)

      expect(result[0].ccList).toEqual([])
    })

    it('should parse multiple recipients and CCs', () => {
      const dataRows = [
        {
          recipient: 'user1@test.com; user2@test.com',
          cc: 'cc1@test.com, cc2@test.com',
          name: 'Test',
        },
      ]

      const template = {
        subject: 'Test',
        htmlString: '<p>Test</p>',
      }

      const result = prepareBulkEmailData(dataRows, template, mockReplaceParameters)

      expect(result[0].recipients).toEqual(['user1@test.com', 'user2@test.com'])
      expect(result[0].ccList).toEqual(['cc1@test.com', 'cc2@test.com'])
    })
  })
})
