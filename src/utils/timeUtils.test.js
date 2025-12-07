import { describe, it, expect } from 'vitest'
import {
  calculateEndTime,
  formatDateTimeWithDay,
  formatLongDate,
  format12HourTime,
  combineDateAndTime,
  parse12HourTimeTo24Hour,
  convert24HourTo12Hour,
} from './timeUtils'

describe('timeUtils', () => {
  describe('formatDateTimeWithDay', () => {
    it('should format date correctly with day of week', () => {
      // December 8, 2025 is a Monday
      const dateString = '2025-12-08T17:00'
      const result = formatDateTimeWithDay(dateString)
      expect(result).toBe('2025, December, 08 - 17:00 Monday')
    })

    it('should format date with different time', () => {
      // December 25, 2025 is a Thursday
      const dateString = '2025-12-25T14:30'
      const result = formatDateTimeWithDay(dateString)
      expect(result).toBe('2025, December, 25 - 14:30 Thursday')
    })

    it('should format date at midnight', () => {
      // January 1, 2026 is a Thursday
      const dateString = '2026-01-01T00:00'
      const result = formatDateTimeWithDay(dateString)
      expect(result).toBe('2026, January, 01 - 00:00 Thursday')
    })

    it('should format date at end of day', () => {
      // December 31, 2025 is a Wednesday
      const dateString = '2025-12-31T23:59'
      const result = formatDateTimeWithDay(dateString)
      expect(result).toBe('2025, December, 31 - 23:59 Wednesday')
    })

    it('should handle ISO string with timezone', () => {
      // The formatted output should use local time
      const dateString = '2025-12-08T17:00:00.000Z'
      const result = formatDateTimeWithDay(dateString)
      // Result will vary based on timezone, but should contain the format
      expect(result).toMatch(/^\d{4}, \w+, \d{2} - \d{2}:\d{2} \w+$/)
    })

    it('should return empty string for invalid date', () => {
      const result = formatDateTimeWithDay('invalid-date')
      expect(result).toBe('')
    })

    it('should return empty string for empty string', () => {
      const result = formatDateTimeWithDay('')
      expect(result).toBe('')
    })

    it('should return empty string for null', () => {
      const result = formatDateTimeWithDay(null)
      expect(result).toBe('')
    })

    it('should format February date correctly', () => {
      // February 14, 2025 is a Friday
      const dateString = '2025-02-14T12:00'
      const result = formatDateTimeWithDay(dateString)
      expect(result).toBe('2025, February, 14 - 12:00 Friday')
    })

    it('should format date in different month', () => {
      // July 4, 2025 is a Friday
      const dateString = '2025-07-04T16:30'
      const result = formatDateTimeWithDay(dateString)
      expect(result).toBe('2025, July, 04 - 16:30 Friday')
    })
  })

  describe('calculateEndTime', () => {
    it('should calculate end time with 60 minutes duration', () => {
      // 2025-12-08 5:00 PM + 60 minutes = 2025-12-08 6:00 PM
      const startTime = '2025-12-08T17:00'
      const result = calculateEndTime(startTime, 60)
      expect(result).toBe('2025-12-08T18:00')
    })

    it('should calculate end time with 30 minutes duration', () => {
      // 2025-12-08 2:00 PM + 30 minutes = 2025-12-08 2:30 PM
      const startTime = '2025-12-08T14:00'
      const result = calculateEndTime(startTime, 30)
      expect(result).toBe('2025-12-08T14:30')
    })

    it('should calculate end time with 90 minutes duration', () => {
      // 2025-12-08 10:00 AM + 90 minutes = 2025-12-08 11:30 AM
      const startTime = '2025-12-08T10:00'
      const result = calculateEndTime(startTime, 90)
      expect(result).toBe('2025-12-08T11:30')
    })

    it('should calculate end time with 120 minutes duration', () => {
      // 2025-12-08 3:00 PM + 120 minutes = 2025-12-08 5:00 PM
      const startTime = '2025-12-08T15:00'
      const result = calculateEndTime(startTime, 120)
      expect(result).toBe('2025-12-08T17:00')
    })

    it('should calculate end time with 15 minutes duration', () => {
      // 2025-12-08 9:45 AM + 15 minutes = 2025-12-08 10:00 AM
      const startTime = '2025-12-08T09:45'
      const result = calculateEndTime(startTime, 15)
      expect(result).toBe('2025-12-08T10:00')
    })

    it('should handle time crossing midnight', () => {
      // 2025-12-08 11:30 PM + 60 minutes = 2025-12-09 12:30 AM
      const startTime = '2025-12-08T23:30'
      const result = calculateEndTime(startTime, 60)
      expect(result).toBe('2025-12-09T00:30')
    })

    it('should handle time crossing midnight with larger duration', () => {
      // 2025-12-08 11:00 PM + 120 minutes = 2025-12-09 1:00 AM
      const startTime = '2025-12-08T23:00'
      const result = calculateEndTime(startTime, 120)
      expect(result).toBe('2025-12-09T01:00')
    })

    it('should handle end of month crossing', () => {
      // 2025-12-31 11:30 PM + 60 minutes = 2026-01-01 12:30 AM
      const startTime = '2025-12-31T23:30'
      const result = calculateEndTime(startTime, 60)
      expect(result).toBe('2026-01-01T00:30')
    })

    it('should handle leap second precision', () => {
      // 2025-12-08 1:23 PM + 37 minutes = 2025-12-08 2:00 PM
      const startTime = '2025-12-08T13:23'
      const result = calculateEndTime(startTime, 37)
      expect(result).toBe('2025-12-08T14:00')
    })

    it('should handle full ISO string with seconds', () => {
      // Full ISO string with seconds should also work (without timezone)
      const startTime = '2025-12-08T17:00:00'
      const result = calculateEndTime(startTime, 60)
      expect(result).toBe('2025-12-08T18:00')
    })

    it('should handle duration as string', () => {
      // Duration can be passed as a string
      const startTime = '2025-12-08T17:00'
      const result = calculateEndTime(startTime, '60')
      expect(result).toBe('2025-12-08T18:00')
    })

    it('should handle very long durations', () => {
      // 2025-12-08 9:00 AM + 480 minutes (8 hours) = 2025-12-08 5:00 PM
      const startTime = '2025-12-08T09:00'
      const result = calculateEndTime(startTime, 480)
      expect(result).toBe('2025-12-08T17:00')
    })

    it('should handle 1 minute duration', () => {
      // 2025-12-08 2:59 PM + 1 minute = 2025-12-08 3:00 PM
      const startTime = '2025-12-08T14:59'
      const result = calculateEndTime(startTime, 1)
      expect(result).toBe('2025-12-08T15:00')
    })

    it('should handle duration spanning multiple days', () => {
      // 2025-12-08 9:00 AM + 1440 minutes (24 hours) = 2025-12-09 9:00 AM
      const startTime = '2025-12-08T09:00'
      const result = calculateEndTime(startTime, 1440)
      expect(result).toBe('2025-12-09T09:00')
    })

    // Edge cases
    it('should return empty string for empty startTime', () => {
      const result = calculateEndTime('', 60)
      expect(result).toBe('')
    })

    it('should return empty string for missing duration', () => {
      const result = calculateEndTime('2025-12-08T17:00', '')
      expect(result).toBe('')
    })

    it('should return empty string for invalid startTime', () => {
      const result = calculateEndTime('invalid-date', 60)
      expect(result).toBe('')
    })

    it('should return empty string for invalid duration', () => {
      const result = calculateEndTime('2025-12-08T17:00', 'invalid')
      expect(result).toBe('')
    })

    it('should return empty string for null startTime', () => {
      const result = calculateEndTime(null, 60)
      expect(result).toBe('')
    })

    it('should return empty string for null duration', () => {
      const result = calculateEndTime('2025-12-08T17:00', null)
      expect(result).toBe('')
    })

    it('should handle zero duration (returns same time)', () => {
      // Zero duration should return the start time unchanged
      const result = calculateEndTime('2025-12-08T17:00', 0)
      expect(result).toBe('2025-12-08T17:00')
    })

    it('should handle negative duration (time going backwards)', () => {
      // 2025-12-08 5:00 PM - 60 minutes = 2025-12-08 4:00 PM
      const startTime = '2025-12-08T17:00'
      const result = calculateEndTime(startTime, -60)
      expect(result).toBe('2025-12-08T16:00')
    })

    // Real-world scenarios
    it('should handle common meeting durations - 30 min standup', () => {
      const startTime = '2025-12-09T09:00'
      const result = calculateEndTime(startTime, 30)
      expect(result).toBe('2025-12-09T09:30')
    })

    it('should handle common meeting durations - 1 hour meeting', () => {
      const startTime = '2025-12-09T14:00'
      const result = calculateEndTime(startTime, 60)
      expect(result).toBe('2025-12-09T15:00')
    })

    it('should handle common meeting durations - 90 min workshop', () => {
      const startTime = '2025-12-09T10:30'
      const result = calculateEndTime(startTime, 90)
      expect(result).toBe('2025-12-09T12:00')
    })

    it('should handle common meeting durations - 2 hour training', () => {
      const startTime = '2025-12-09T13:00'
      const result = calculateEndTime(startTime, 120)
      expect(result).toBe('2025-12-09T15:00')
    })
  })

  describe('formatLongDate', () => {
    it('should format date in long format with ordinal', () => {
      // December 11, 2025 is a Thursday
      const dateString = '2025-12-11T14:00'
      const result = formatLongDate(dateString)
      expect(result).toBe('Thursday, 11th December 2025')
    })

    it('should handle 1st correctly', () => {
      const dateString = '2025-12-01T10:00'
      const result = formatLongDate(dateString)
      expect(result).toBe('Monday, 1st December 2025')
    })

    it('should handle 2nd correctly', () => {
      const dateString = '2025-12-02T10:00'
      const result = formatLongDate(dateString)
      expect(result).toBe('Tuesday, 2nd December 2025')
    })

    it('should handle 3rd correctly', () => {
      const dateString = '2025-12-03T10:00'
      const result = formatLongDate(dateString)
      expect(result).toBe('Wednesday, 3rd December 2025')
    })

    it('should handle 21st correctly', () => {
      const dateString = '2025-12-21T10:00'
      const result = formatLongDate(dateString)
      expect(result).toBe('Sunday, 21st December 2025')
    })

    it('should handle 22nd correctly', () => {
      const dateString = '2025-12-22T10:00'
      const result = formatLongDate(dateString)
      expect(result).toBe('Monday, 22nd December 2025')
    })

    it('should handle 23rd correctly', () => {
      const dateString = '2025-12-23T10:00'
      const result = formatLongDate(dateString)
      expect(result).toBe('Tuesday, 23rd December 2025')
    })

    it('should handle 11th-13th correctly (special case)', () => {
      expect(formatLongDate('2025-12-11T10:00')).toBe('Thursday, 11th December 2025')
      expect(formatLongDate('2025-12-12T10:00')).toBe('Friday, 12th December 2025')
      expect(formatLongDate('2025-12-13T10:00')).toBe('Saturday, 13th December 2025')
    })

    it('should return empty string for invalid date', () => {
      const result = formatLongDate('invalid')
      expect(result).toBe('')
    })

    it('should return empty string for empty string', () => {
      const result = formatLongDate('')
      expect(result).toBe('')
    })
  })

  describe('format12HourTime', () => {
    it('should format 2:00 PM correctly', () => {
      const dateString = '2025-12-08T14:00'
      const result = format12HourTime(dateString)
      expect(result).toBe('02:00 PM')
    })

    it('should format midnight correctly', () => {
      const dateString = '2025-12-08T00:00'
      const result = format12HourTime(dateString)
      expect(result).toBe('12:00 AM')
    })

    it('should format noon correctly', () => {
      const dateString = '2025-12-08T12:00'
      const result = format12HourTime(dateString)
      expect(result).toBe('12:00 PM')
    })

    it('should format morning time correctly', () => {
      const dateString = '2025-12-08T09:30'
      const result = format12HourTime(dateString)
      expect(result).toBe('09:30 AM')
    })

    it('should format 11:59 PM correctly', () => {
      const dateString = '2025-12-08T23:59'
      const result = format12HourTime(dateString)
      expect(result).toBe('11:59 PM')
    })

    it('should return empty string for invalid date', () => {
      const result = format12HourTime('invalid')
      expect(result).toBe('')
    })

    it('should return empty string for empty string', () => {
      const result = format12HourTime('')
      expect(result).toBe('')
    })
  })

  describe('combineDateAndTime', () => {
    it('should combine date and time correctly', () => {
      const result = combineDateAndTime('2025-12-08', '14:00')
      expect(result).toBe('2025-12-08T14:00')
    })

    it('should return empty string if date is missing', () => {
      const result = combineDateAndTime('', '14:00')
      expect(result).toBe('')
    })

    it('should return empty string if time is missing', () => {
      const result = combineDateAndTime('2025-12-08', '')
      expect(result).toBe('')
    })
  })

  describe('parse12HourTimeTo24Hour', () => {
    it('should parse 02:00 PM to 14:00', () => {
      const result = parse12HourTimeTo24Hour('02:00 PM')
      expect(result).toBe('14:00')
    })

    it('should parse 02:00 AM to 02:00', () => {
      const result = parse12HourTimeTo24Hour('02:00 AM')
      expect(result).toBe('02:00')
    })

    it('should parse 12:00 PM (noon) to 12:00', () => {
      const result = parse12HourTimeTo24Hour('12:00 PM')
      expect(result).toBe('12:00')
    })

    it('should parse 12:00 AM (midnight) to 00:00', () => {
      const result = parse12HourTimeTo24Hour('12:00 AM')
      expect(result).toBe('00:00')
    })

    it('should parse 11:59 PM to 23:59', () => {
      const result = parse12HourTimeTo24Hour('11:59 PM')
      expect(result).toBe('23:59')
    })

    it('should parse single digit hour', () => {
      const result = parse12HourTimeTo24Hour('9:30 AM')
      expect(result).toBe('09:30')
    })

    it('should be case insensitive for AM/PM', () => {
      expect(parse12HourTimeTo24Hour('02:00 pm')).toBe('14:00')
      expect(parse12HourTimeTo24Hour('02:00 Pm')).toBe('14:00')
      expect(parse12HourTimeTo24Hour('02:00 am')).toBe('02:00')
    })

    it('should return empty string for invalid format', () => {
      expect(parse12HourTimeTo24Hour('invalid')).toBe('')
      expect(parse12HourTimeTo24Hour('25:00 PM')).toBe('')
      expect(parse12HourTimeTo24Hour('00:00 PM')).toBe('')
      expect(parse12HourTimeTo24Hour('13:00 PM')).toBe('')
    })

    it('should return empty string for empty input', () => {
      const result = parse12HourTimeTo24Hour('')
      expect(result).toBe('')
    })
  })

  describe('convert24HourTo12Hour', () => {
    it('should convert 14:00 to 02:00 PM', () => {
      const result = convert24HourTo12Hour('14:00')
      expect(result).toBe('02:00 PM')
    })

    it('should convert 02:00 to 02:00 AM', () => {
      const result = convert24HourTo12Hour('02:00')
      expect(result).toBe('02:00 AM')
    })

    it('should convert 12:00 (noon) to 12:00 PM', () => {
      const result = convert24HourTo12Hour('12:00')
      expect(result).toBe('12:00 PM')
    })

    it('should convert 00:00 (midnight) to 12:00 AM', () => {
      const result = convert24HourTo12Hour('00:00')
      expect(result).toBe('12:00 AM')
    })

    it('should convert 23:59 to 11:59 PM', () => {
      const result = convert24HourTo12Hour('23:59')
      expect(result).toBe('11:59 PM')
    })

    it('should return empty string for invalid time', () => {
      expect(convert24HourTo12Hour('25:00')).toBe('')
      expect(convert24HourTo12Hour('invalid')).toBe('')
    })

    it('should return empty string for empty input', () => {
      const result = convert24HourTo12Hour('')
      expect(result).toBe('')
    })
  })
})
