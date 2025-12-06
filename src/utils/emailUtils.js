import validator from 'validator'

/**
 * Validate a single email address
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = email => {
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
 * @param {string} emailString - String with email addresses
 * @returns {Array<string>} Array of email addresses
 */
export const parseEmailList = emailString => {
  if (!emailString || !emailString.trim()) return []
  return emailString
    .split(/[,;]/)
    .map(email => email.trim())
    .filter(Boolean)
}

/**
 * Validate a list of email addresses
 * @param {string} emailString - Comma or semicolon separated email addresses
 * @returns {Object} Validation result with isValid flag and invalid emails
 */
export const validateEmailList = emailString => {
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
