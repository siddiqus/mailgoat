import { v4 as uuidv4 } from 'uuid'

/**
 * LocalStorage repository for email history
 */
class EmailHistoryRepository {
  constructor() {
    this.storageKey = 'MailGoat_emailHistory'
  }

  /**
   * Get all email history records
   * @returns {Promise<Array>} Array of email history objects
   */
  async getAll() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error reading email history from localStorage:', error)
      return []
    }
  }

  /**
   * Get a single email history record by ID
   * @param {string} id - Email history ID
   * @returns {Promise<Object|null>} Email history object or null
   */
  async getById(id) {
    const history = await this.getAll()
    return history.find(h => h.id === id) || null
  }

  /**
   * Save a new email to history
   * @param {Object} emailData - Email data to save
   * @returns {Promise<Object>} Saved email history record
   */
  async create(emailData) {
    const history = await this.getAll()
    const newRecord = {
      id: uuidv4(),
      ...emailData,
      sentAt: new Date().toISOString(),
    }
    history.unshift(newRecord) // Add to beginning of array
    this._save(history)
    return newRecord
  }

  /**
   * Delete an email history record
   * @param {string} id - Email history ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async delete(id) {
    const history = await this.getAll()
    const filteredHistory = history.filter(h => h.id !== id)

    if (filteredHistory.length === history.length) {
      return false // Record not found
    }

    this._save(filteredHistory)
    return true
  }

  /**
   * Clear all email history
   * @returns {Promise<void>}
   */
  async clear() {
    this._save([])
  }

  /**
   * Save history to localStorage
   * @private
   */
  _save(history) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(history))
    } catch (error) {
      console.error('Error saving email history to localStorage:', error)
      throw new Error('Failed to save email history')
    }
  }
}

export default EmailHistoryRepository
