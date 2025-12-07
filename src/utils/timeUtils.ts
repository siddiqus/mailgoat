/**
 * Format a date to show: Year, Month, Date - Hour:Minute DayOfWeek
 * @param dateString - ISO string or datetime string
 * @returns Formatted string like "2025, December, 08 - 17:00 Sunday"
 */
export const formatDateTimeWithDay = (dateString: string): string => {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''

    const year = date.getFullYear()
    const month = date.toLocaleDateString('en-US', { month: 'long' })
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })

    return `${year}, ${month}, ${day} - ${hours}:${minutes} ${dayOfWeek}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return ''
  }
}

/**
 * Calculate end time from start time and duration in minutes
 * @param startTime - ISO string or datetime string representing the start time
 * @param durationInMinutes - Number of minutes to add to start time
 * @returns ISO string with end time in format 'YYYY-MM-DDTHH:MM', or empty string if inputs are invalid
 */
export const calculateEndTime = (startTime: string, durationInMinutes: number | string): string => {
  if (!startTime || (durationInMinutes !== 0 && !durationInMinutes)) return ''

  try {
    const start = new Date(startTime)
    const duration =
      typeof durationInMinutes === 'string' ? parseInt(durationInMinutes, 10) : durationInMinutes

    // Validate that the date is valid and duration is a valid number
    if (isNaN(start.getTime()) || isNaN(duration)) {
      return ''
    }

    const end = new Date(start.getTime())
    end.setMinutes(end.getMinutes() + duration)

    // Format manually to avoid timezone conversion (toISOString converts to UTC)
    // Return in format compatible with datetime-local input: YYYY-MM-DDTHH:MM
    const year = end.getFullYear()
    const month = String(end.getMonth() + 1).padStart(2, '0')
    const day = String(end.getDate()).padStart(2, '0')
    const hours = String(end.getHours()).padStart(2, '0')
    const minutes = String(end.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch (error) {
    console.error('Error calculating end time:', error)
    return ''
  }
}

/**
 * Get ordinal suffix for a day number (e.g., 1st, 2nd, 3rd, 4th)
 * @param day - Day of month (1-31)
 * @returns Ordinal suffix ("st", "nd", "rd", or "th")
 */
const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th' // 11th-20th
  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

/**
 * Format date in long format: "Thursday, 11th December 2025"
 * @param dateString - ISO string or datetime string
 * @returns Formatted date string
 */
export const formatLongDate = (dateString: string): string => {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''

    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
    const day = date.getDate()
    const month = date.toLocaleDateString('en-US', { month: 'long' })
    const year = date.getFullYear()
    const ordinal = getOrdinalSuffix(day)

    return `${dayOfWeek}, ${day}${ordinal} ${month} ${year}`
  } catch (error) {
    console.error('Error formatting long date:', error)
    return ''
  }
}

/**
 * Format time in 12-hour format: "02:00 PM"
 * @param dateString - ISO string or datetime string
 * @returns Formatted time string
 */
export const format12HourTime = (dateString: string): string => {
  if (!dateString) return ''

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''

    let hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'

    hours = hours % 12
    hours = hours || 12 // Convert 0 to 12

    const minutesStr = String(minutes).padStart(2, '0')
    const hoursStr = String(hours).padStart(2, '0')

    return `${hoursStr}:${minutesStr} ${ampm}`
  } catch (error) {
    console.error('Error formatting 12-hour time:', error)
    return ''
  }
}

/**
 * Combine date and time inputs into a datetime-local format (YYYY-MM-DDTHH:MM)
 * @param date - Date in YYYY-MM-DD format
 * @param time - Time in HH:MM format (24-hour)
 * @returns Datetime string in YYYY-MM-DDTHH:MM format
 */
export const combineDateAndTime = (date: string, time: string): string => {
  if (!date || !time) return ''
  return `${date}T${time}`
}

/**
 * Parse 12-hour time format (e.g., "02:00 PM") to 24-hour format (e.g., "14:00")
 * @param time12h - Time in 12-hour format with AM/PM
 * @returns Time in 24-hour format (HH:MM)
 */
export const parse12HourTimeTo24Hour = (time12h: string): string => {
  if (!time12h) return ''

  try {
    const match = time12h.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!match) return ''

    let hours = parseInt(match[1], 10)
    const minutes = match[2]
    const ampm = match[3].toUpperCase()

    if (hours < 1 || hours > 12) return ''

    if (ampm === 'PM' && hours !== 12) {
      hours += 12
    } else if (ampm === 'AM' && hours === 12) {
      hours = 0
    }

    return `${String(hours).padStart(2, '0')}:${minutes}`
  } catch (error) {
    console.error('Error parsing 12-hour time:', error)
    return ''
  }
}

/**
 * Convert 24-hour time (HH:MM) to 12-hour format with AM/PM
 * @param time24h - Time in 24-hour format
 * @returns Time in 12-hour format with AM/PM
 */
export const convert24HourTo12Hour = (time24h: string): string => {
  if (!time24h) return ''

  try {
    const [hoursStr, minutes] = time24h.split(':')
    let hours = parseInt(hoursStr, 10)

    if (isNaN(hours) || hours < 0 || hours > 23) return ''

    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours || 12

    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`
  } catch (error) {
    console.error('Error converting to 12-hour format:', error)
    return ''
  }
}
