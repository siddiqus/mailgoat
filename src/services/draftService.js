/**
 * Draft Service - Handles persisting and retrieving draft data for emails and calendar invites
 */

const DRAFT_KEYS = {
  SEND_EMAIL_SINGLE: 'draft_send_email_single',
  SEND_EMAIL_BULK: 'draft_send_email_bulk',
  CALENDAR_INVITE_SINGLE: 'draft_calendar_invite_single',
  CALENDAR_INVITE_BULK: 'draft_calendar_invite_bulk',
}

/**
 * Save draft to localStorage
 * @param {string} key - Draft key from DRAFT_KEYS
 * @param {object} data - Draft data to save
 */
export const saveDraft = (key, data) => {
  try {
    const draft = {
      data,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(key, JSON.stringify(draft))
  } catch (error) {
    console.error('Error saving draft:', error)
  }
}

/**
 * Load draft from localStorage
 * @param {string} key - Draft key from DRAFT_KEYS
 * @returns {object|null} - Draft data or null if not found
 */
export const loadDraft = key => {
  try {
    const draftJson = localStorage.getItem(key)
    if (!draftJson) return null

    const draft = JSON.parse(draftJson)
    return draft.data
  } catch (error) {
    console.error('Error loading draft:', error)
    return null
  }
}

/**
 * Clear draft from localStorage
 * @param {string} key - Draft key from DRAFT_KEYS
 */
export const clearDraft = key => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error clearing draft:', error)
  }
}

/**
 * Check if draft exists
 * @param {string} key - Draft key from DRAFT_KEYS
 * @returns {boolean} - True if draft exists
 */
export const hasDraft = key => {
  try {
    const draftJson = localStorage.getItem(key)
    return !!draftJson
  } catch (error) {
    console.error('Error checking draft:', error)
    return false
  }
}

/**
 * Get draft timestamp
 * @param {string} key - Draft key from DRAFT_KEYS
 * @returns {string|null} - ISO timestamp or null if not found
 */
export const getDraftTimestamp = key => {
  try {
    const draftJson = localStorage.getItem(key)
    if (!draftJson) return null

    const draft = JSON.parse(draftJson)
    return draft.timestamp
  } catch (error) {
    console.error('Error getting draft timestamp:', error)
    return null
  }
}

export { DRAFT_KEYS }
