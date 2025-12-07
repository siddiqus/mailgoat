import timezones from './timezones.json'

// Map common IANA timezone identifiers to Windows timezone names
const IANA_TO_WINDOWS_MAP: Record<string, string> = {
  // Americas
  'America/New_York': 'Eastern Standard Time',
  'America/Toronto': 'Eastern Standard Time',
  'America/Chicago': 'Central Standard Time',
  'America/Mexico_City': 'Central Standard Time (Mexico)',
  'America/Denver': 'Mountain Standard Time',
  'America/Phoenix': 'US Mountain Standard Time',
  'America/Los_Angeles': 'Pacific Standard Time',
  'America/Vancouver': 'Pacific Standard Time',
  'America/Tijuana': 'Pacific Standard Time (Mexico)',
  'America/Argentina/Buenos_Aires': 'SA Eastern Standard Time',
  'America/Bogota': 'SA Pacific Standard Time',
  'America/Lima': 'SA Pacific Standard Time',
  'America/Santiago': 'Pacific SA Standard Time',
  'America/Sao_Paulo': 'E. South America Standard Time',
  'America/Caracas': 'Venezuela Standard Time',
  'America/Halifax': 'Atlantic Standard Time',
  'America/Havana': 'Cuba Standard Time',
  'America/Regina': 'Canada Central Standard Time',

  // Europe
  'Europe/London': 'GMT Standard Time',
  'Europe/Paris': 'W. Europe Standard Time',
  'Europe/Berlin': 'W. Europe Standard Time',
  'Europe/Rome': 'W. Europe Standard Time',
  'Europe/Brussels': 'Romance Standard Time',
  'Europe/Warsaw': 'Central European Standard Time',
  'Europe/Budapest': 'Central Europe Standard Time',
  'Europe/Athens': 'GTB Standard Time',
  'Europe/Istanbul': 'Turkey Standard Time',
  'Europe/Moscow': 'Russian Standard Time',
  'Europe/Helsinki': 'FLE Standard Time',
  'Europe/Bucharest': 'E. Europe Standard Time',
  'Europe/Minsk': 'Belarus Standard Time',

  // Asia
  'Asia/Dubai': 'Arabian Standard Time',
  'Asia/Riyadh': 'Arabian Standard Time',
  'Asia/Baghdad': 'Arab Standard Time',
  'Asia/Tehran': 'Iran Standard Time',
  'Asia/Kabul': 'Afghanistan Standard Time',
  'Asia/Karachi': 'Pakistan Standard Time',
  'Asia/Kolkata': 'India Standard Time',
  'Asia/Colombo': 'Sri Lanka Standard Time',
  'Asia/Kathmandu': 'Nepal Standard Time',
  'Asia/Dhaka': 'Bangladesh Standard Time',
  'Asia/Yangon': 'Myanmar Standard Time',
  'Asia/Bangkok': 'SE Asia Standard Time',
  'Asia/Shanghai': 'China Standard Time',
  'Asia/Beijing': 'China Standard Time',
  'Asia/Hong_Kong': 'China Standard Time',
  'Asia/Singapore': 'Singapore Standard Time',
  'Asia/Taipei': 'Taipei Standard Time',
  'Asia/Tokyo': 'Tokyo Standard Time',
  'Asia/Seoul': 'Korea Standard Time',
  'Asia/Jerusalem': 'Israel Standard Time',
  'Asia/Amman': 'Jordan Standard Time',
  'Asia/Beirut': 'Middle East Standard Time',
  'Asia/Yerevan': 'Armenia Standard Time',
  'Asia/Baku': 'Azerbaijan Standard Time',
  'Asia/Tashkent': 'West Asia Standard Time',
  'Asia/Almaty': 'Central Asia Standard Time',
  'Asia/Yakutsk': 'Yakutsk Standard Time',

  // Africa
  'Africa/Cairo': 'Egypt Standard Time',
  'Africa/Johannesburg': 'South Africa Standard Time',
  'Africa/Nairobi': 'E. Africa Standard Time',
  'Africa/Lagos': 'Africa West Standard Time',
  'Africa/Casablanca': 'Morocco Standard Time',

  // Australia/Oceania
  'Australia/Sydney': 'AUS Eastern Standard Time',
  'Australia/Melbourne': 'AUS Eastern Standard Time',
  'Australia/Brisbane': 'E. Australia Standard Time',
  'Australia/Adelaide': 'Cen. Australia Standard Time',
  'Australia/Darwin': 'AUS Central Standard Time',
  'Australia/Perth': 'W. Australia Standard Time',
  'Australia/Hobart': 'Tasmania Standard Time',
  'Pacific/Auckland': 'New Zealand Standard Time',
  'Pacific/Fiji': 'Fiji Standard Time',
  'Pacific/Honolulu': 'Hawaiian Standard Time',

  // Special
  UTC: 'UTC',
  'Etc/UTC': 'UTC',
  'Etc/GMT': 'UTC',
}

/**
 * Get deduplicated and sorted timezone options for dropdowns
 * @returns Array of {value, label} objects for timezone selection
 */
export const getTimezoneOptions = () => {
  // Use a Map to deduplicate by value (windowsTime)
  const uniqueMap = new Map()

  timezones.forEach(tz => {
    // Only add if we haven't seen this windowsTime before
    if (!uniqueMap.has(tz.windowsTime)) {
      uniqueMap.set(tz.windowsTime, {
        value: tz.windowsTime,
        label: `${tz.windowsTime} (${tz.city})`,
      })
    }
  })

  // Convert Map values to array and sort alphabetically
  return Array.from(uniqueMap.values()).sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Get the browser's timezone in Windows format
 * @returns The browser's timezone mapped to Windows timezone name, or 'Eastern Standard Time' as fallback
 */
export const getBrowserTimezone = (): string => {
  try {
    // Get the IANA timezone from the browser
    const ianaTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Try to map to Windows timezone
    const windowsTimezone = IANA_TO_WINDOWS_MAP[ianaTimezone]

    if (windowsTimezone) {
      return windowsTimezone
    }

    console.warn(
      `Could not map browser timezone "${ianaTimezone}" to Windows timezone. Using fallback.`
    )
    return 'Eastern Standard Time'
  } catch (error) {
    console.error('Error detecting browser timezone:', error)
    return 'Eastern Standard Time'
  }
}

/**
 * Get the default timezone (Eastern Standard Time)
 * @returns The default timezone value
 */
export const getDefaultTimezone = (): string => {
  return 'Eastern Standard Time'
}
