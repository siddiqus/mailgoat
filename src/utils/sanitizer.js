import DOMPurify from 'dompurify'

/**
 * Sanitize HTML string to prevent XSS attacks
 * @param {string} html - HTML string to sanitize
 * @param {Object} options - DOMPurify configuration options
 * @returns {string} Sanitized HTML string
 */
export const sanitizeHtml = (html, options = {}) => {
  if (!html) return ''

  const defaultOptions = {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'img',
      'div',
      'span',
      'table',
      'thead',
      'tbody',
      'tr',
      'td',
      'th',
      'blockquote',
      'code',
      'pre',
      'hr',
      'b',
      'i',
    ],
    ALLOWED_ATTR: [
      'href',
      'src',
      'alt',
      'title',
      'class',
      'id',
      'style',
      'target',
      'width',
      'height',
      'align',
      'border',
      'cellpadding',
      'cellspacing',
    ],
    ALLOW_DATA_ATTR: false,
    ...options,
  }

  return DOMPurify.sanitize(html, defaultOptions)
}

/**
 * Sanitize HTML with strict configuration (for user-generated content)
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML string
 */
export const sanitizeHtmlStrict = html => {
  return sanitizeHtml(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  })
}
