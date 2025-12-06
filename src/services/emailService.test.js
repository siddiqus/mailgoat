import { describe, it, expect } from 'vitest'
import { prepareBulkEmailData } from './emailService'

describe('emailService', () => {
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
