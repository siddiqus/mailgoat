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
