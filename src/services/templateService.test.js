import { describe, it, expect } from 'vitest'
import {
  replaceParameters,
  parseEmailList,
  prepareEmailFromTemplate,
  generateSampleCSV,
} from './templateService'

describe('templateService', () => {
  describe('replaceParameters', () => {
    it('should replace single parameter', () => {
      const result = replaceParameters('Hello {{name}}!', { name: 'John' })
      expect(result).toBe('Hello John!')
    })

    it('should replace multiple parameters', () => {
      const text = 'Hello {{name}}, your email is {{email}}'
      const result = replaceParameters(text, { name: 'John', email: 'john@test.com' })
      expect(result).toBe('Hello John, your email is john@test.com')
    })

    it('should keep unreplaced parameters as is', () => {
      const result = replaceParameters('Hello {{name}}!', {})
      expect(result).toBe('Hello {{name}}!')
    })

    it('should handle empty text', () => {
      expect(replaceParameters('', { name: 'John' })).toBe('')
      expect(replaceParameters(null, { name: 'John' })).toBe('')
    })

    it('should replace the same parameter multiple times', () => {
      const result = replaceParameters('{{name}} and {{name}} again', { name: 'John' })
      expect(result).toBe('John and John again')
    })
  })

  describe('parseEmailList', () => {
    it('should parse comma-separated emails', () => {
      const result = parseEmailList('a@test.com, b@test.com')
      expect(result).toEqual(['a@test.com', 'b@test.com'])
    })

    it('should parse semicolon-separated emails', () => {
      const result = parseEmailList('a@test.com; b@test.com')
      expect(result).toEqual(['a@test.com', 'b@test.com'])
    })

    it('should handle empty string', () => {
      expect(parseEmailList('')).toEqual([])
    })
  })

  describe('prepareEmailFromTemplate', () => {
    it('should prepare email with replaced parameters', () => {
      const template = {
        subject: 'Hello {{name}}',
        htmlString: '<p>Welcome {{name}}, your email is {{email}}</p>',
      }
      const params = { name: 'John', email: 'john@test.com' }

      const result = prepareEmailFromTemplate(template, params)

      expect(result.subject).toBe('Hello John')
      expect(result.htmlBody).toBe('<p>Welcome John, your email is john@test.com</p>')
    })

    it('should handle empty template', () => {
      const template = {}
      const result = prepareEmailFromTemplate(template, {})

      expect(result.subject).toBe('')
      expect(result.htmlBody).toBe('')
    })
  })

  describe('generateSampleCSV', () => {
    it('should generate CSV with required columns', () => {
      const template = {
        parameters: ['name', 'age'],
      }

      const result = generateSampleCSV(template)

      expect(result).toContain('recipient,cc,name,age')
      expect(result).toContain('sample_name')
      expect(result).toContain('sample_age')
    })

    it('should generate CSV without parameters', () => {
      const template = {
        parameters: [],
      }

      const result = generateSampleCSV(template)

      expect(result).toContain('recipient,cc')
    })
  })
})
