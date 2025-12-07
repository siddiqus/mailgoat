export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Extract parameters from HTML string based on {{value}} pattern
 * @param htmlString - HTML string to parse
 * @returns Array of unique parameter names
 */
export function extractParameters(htmlString: string): string[] {
  if (!htmlString) return []

  const parameterPattern = /\{\{([^}]+)\}\}/g
  const parameters = new Set<string>()
  let match: RegExpExecArray | null

  while ((match = parameterPattern.exec(htmlString)) !== null) {
    const paramName = match[1].trim()
    if (paramName) {
      parameters.add(paramName)
    }
  }

  return Array.from(parameters)
}

/**
 * Validate HTML string for proper structure
 * @param htmlString - HTML string to validate
 * @returns Validation result with isValid and errors array
 */
export function validateHTML(htmlString: string): ValidationResult {
  const errors: string[] = []

  if (!htmlString || htmlString.trim() === '') {
    return {
      isValid: false,
      errors: ['HTML string cannot be empty'],
    }
  }

  // Check for unmatched {{ or }}
  const openBrackets = (htmlString.match(/\{\{/g) || []).length
  const closeBrackets = (htmlString.match(/\}\}/g) || []).length

  if (openBrackets !== closeBrackets) {
    errors.push(
      `Unmatched template brackets: ${openBrackets} opening {{ but ${closeBrackets} closing }}`
    )
  }

  // Check for malformed template syntax (e.g., {{{ or }}}})
  const malformedBrackets = /\{{3,}|\}{3,}/g
  if (malformedBrackets.test(htmlString)) {
    errors.push('Malformed template brackets detected (more than 2 consecutive brackets)')
  }

  // Validate HTML tag structure
  const tagValidation = validateHTMLTags(htmlString)
  if (!tagValidation.isValid) {
    errors.push(...tagValidation.errors)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate HTML tags are properly opened and closed
 * @param htmlString - HTML string to validate
 * @returns Validation result
 */
function validateHTMLTags(htmlString: string): ValidationResult {
  const errors: string[] = []
  const selfClosingTags = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ])

  // Remove template parameters temporarily to avoid confusion
  const cleanHtml = htmlString.replace(/\{\{[^}]+\}\}/g, '')

  // Extract all tags
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g
  const stack: string[] = []
  let match: RegExpExecArray | null

  while ((match = tagPattern.exec(cleanHtml)) !== null) {
    const fullTag = match[0]
    const tagName = match[1].toLowerCase()

    // Check if it's a closing tag
    if (fullTag.startsWith('</')) {
      if (stack.length === 0) {
        errors.push(`Closing tag </${tagName}> found without matching opening tag`)
      } else {
        const lastOpened = stack.pop()
        if (lastOpened !== tagName) {
          errors.push(
            `Tag mismatch: expected closing tag for <${lastOpened}> but found </${tagName}>`
          )
        }
      }
    }
    // Check if it's a self-closing tag or void element
    else if (fullTag.endsWith('/>') || selfClosingTags.has(tagName)) {
      // Self-closing or void element, no action needed
      continue
    }
    // It's an opening tag
    else {
      stack.push(tagName)
    }
  }

  // Check for unclosed tags
  if (stack.length > 0) {
    errors.push(`Unclosed tags: ${stack.map(t => `<${t}>`).join(', ')}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Check if HTML string is valid and ready for use
 * @param htmlString - HTML string to check
 * @returns True if valid
 */
export function isValidTemplate(htmlString: string): boolean {
  const validation = validateHTML(htmlString)
  return validation.isValid
}
