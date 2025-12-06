import { describe, it, expect } from 'vitest'
import { isValidEmail, parseEmailList, validateEmailList } from './emailUtils'

describe('emailValidator', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@example.co.uk')).toBe(true)
      expect(isValidEmail('user+tag@example.com')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('invalid@')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('invalid@example')).toBe(false)
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail(null)).toBe(false)
    })

    it('should handle emails with spaces', () => {
      expect(isValidEmail(' test@example.com ')).toBe(true)
      expect(isValidEmail('test @example.com')).toBe(false)
    })
  })

  describe('parseEmailList', () => {
    it('should parse comma-separated emails', () => {
      const result = parseEmailList('user1@test.com, user2@test.com, user3@test.com')
      expect(result).toEqual(['user1@test.com', 'user2@test.com', 'user3@test.com'])
    })

    it('should parse semicolon-separated emails', () => {
      const result = parseEmailList('user1@test.com; user2@test.com; user3@test.com')
      expect(result).toEqual(['user1@test.com', 'user2@test.com', 'user3@test.com'])
    })

    it('should handle mixed separators', () => {
      const result = parseEmailList('user1@test.com, user2@test.com; user3@test.com')
      expect(result).toEqual(['user1@test.com', 'user2@test.com', 'user3@test.com'])
    })

    it('should handle empty string', () => {
      expect(parseEmailList('')).toEqual([])
      expect(parseEmailList('   ')).toEqual([])
      expect(parseEmailList(null)).toEqual([])
    })

    it('should trim whitespace from emails', () => {
      const result = parseEmailList('  user1@test.com  ,  user2@test.com  ')
      expect(result).toEqual(['user1@test.com', 'user2@test.com'])
    })
  })

  describe('validateEmailList', () => {
    it('should validate list of valid emails', () => {
      const result = validateEmailList('user1@test.com, user2@test.com')
      expect(result.isValid).toBe(true)
      expect(result.invalidEmails).toEqual([])
    })

    it('should detect invalid emails in list', () => {
      const result = validateEmailList('valid@test.com, invalid, another@test.com')
      expect(result.isValid).toBe(false)
      expect(result.invalidEmails).toEqual(['invalid'])
    })

    it('should handle empty string as valid', () => {
      const result = validateEmailList('')
      expect(result.isValid).toBe(true)
      expect(result.invalidEmails).toEqual([])
    })

    it('should return all invalid emails', () => {
      const result = validateEmailList('invalid1, invalid2@, @invalid3')
      expect(result.isValid).toBe(false)
      expect(result.invalidEmails.length).toBe(3)
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
})
