import validator from 'validator'

export interface EmailValidationResult {
  isValid: boolean
  invalidEmails: string[]
}

/**
 * Validate a single email address
 * @param email - Email address to validate
 * @returns True if valid email
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false
  return validator.isEmail(email.trim(), {
    allow_display_name: false,
    require_display_name: false,
    allow_utf8_local_part: true,
    require_tld: true,
  })
}

/**
 * Parse email addresses from a string (comma or semicolon separated)
 * @param emailString - String with email addresses
 * @returns Array of email addresses
 */
export const parseEmailList = (emailString: string): string[] => {
  if (!emailString || !emailString.trim()) return []
  return emailString
    .split(/[,;]/)
    .map(email => email.trim())
    .filter(Boolean)
}

/**
 * Validate a list of email addresses
 * @param emailString - Comma or semicolon separated email addresses
 * @returns Validation result with isValid flag and invalid emails
 */
export const validateEmailList = (emailString: string): EmailValidationResult => {
  if (!emailString || !emailString.trim()) {
    return { isValid: true, invalidEmails: [] }
  }

  const emails = parseEmailList(emailString)
  const invalidEmails = emails.filter(email => !isValidEmail(email))

  return {
    isValid: invalidEmails.length === 0,
    invalidEmails,
  }
}
