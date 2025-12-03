/**
 * LocalStorage implementation for Settings Repository
 */
class LocalStorageSettingsRepository {
  constructor() {
    this.storageKey = 'MailGoat_settings'
  }

  /**
   * Get all settings from localStorage
   * @returns {Promise<Object>} Settings object
   */
  async getSettings() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : this._getDefaultSettings()
    } catch (error) {
      console.error('Error reading settings from localStorage:', error)
      return this._getDefaultSettings()
    }
  }

  /**
   * Save settings to localStorage
   * @param {Object} settings - Settings object
   * @returns {Promise<Object>} Saved settings
   */
  async saveSettings(settings) {
    try {
      const updatedSettings = {
        ...settings,
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem(this.storageKey, JSON.stringify(updatedSettings))
      return updatedSettings
    } catch (error) {
      console.error('Error saving settings to localStorage:', error)
      throw new Error('Failed to save settings')
    }
  }

  /**
   * Get default settings
   * @private
   */
  _getDefaultSettings() {
    return {
      emailProvider: 'webhook', // 'webhook' or 'smtp'
      webhook: {
        url: '',
        headers: [],
        bodyMapping: {
          recipients: 'recipients',
          ccList: 'ccList',
          subject: 'subject',
          htmlBody: 'message',
        },
      },
      smtp: {
        host: '',
        port: 587,
        secure: false,
        username: '',
        password: '',
        fromEmail: '',
        fromName: '',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
}

export default LocalStorageSettingsRepository
