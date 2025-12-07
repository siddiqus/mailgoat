import { v4 as uuidv4 } from 'uuid'
import type { EmailHistoryRecord } from '../types/models'

/**
 * LocalStorage repository for email history
 */
class EmailHistoryRepository {
  private storageKey: string

  constructor() {
    this.storageKey = 'MailGoat_emailHistory'
  }

  /**
   * Get all email history records
   * @returns Array of email history objects
   */
  async getAll(): Promise<EmailHistoryRecord[]> {
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
   * @param id - Email history ID
   * @returns Email history object or null
   */
  async getById(id: string): Promise<EmailHistoryRecord | null> {
    const history = await this.getAll()
    return history.find(h => h.id === id) || null
  }

  /**
   * Save a new email to history
   * @param emailData - Email data to save
   * @returns Saved email history record
   */
  async create(emailData: Partial<EmailHistoryRecord>): Promise<EmailHistoryRecord> {
    const history = await this.getAll()
    const newRecord: EmailHistoryRecord = {
      emailId: emailData.id,
      ...emailData,
      id: uuidv4(), // remove id from emailData and generate history ID
      sentAt: emailData.sentAt || new Date().toISOString(),
    } as EmailHistoryRecord
    history.unshift(newRecord) // Add to beginning of array
    this._save(history)
    return newRecord
  }

  /**
   * Update an email history record
   * @param id - Email history ID
   * @param updates - Fields to update
   * @returns Updated record or null if not found
   */
  async update(
    id: string,
    updates: Partial<EmailHistoryRecord>
  ): Promise<EmailHistoryRecord | null> {
    const history = await this.getAll()
    const index = history.findIndex(h => h.id === id)

    if (index === -1) {
      return null // Record not found
    }

    history[index] = {
      ...history[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this._save(history)
    return history[index]
  }

  /**
   * Delete an email history record
   * @param id - Email history ID
   * @returns True if deleted successfully
   */
  async delete(id: string): Promise<boolean> {
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
   * @returns void
   */
  async clear(): Promise<void> {
    this._save([])
  }

  /**
   * Save history to localStorage
   * @private
   */
  private _save(history: EmailHistoryRecord[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(history))
    } catch (error) {
      console.error('Error saving email history to localStorage:', error)
      throw new Error('Failed to save email history')
    }
  }
}

export default EmailHistoryRepository
