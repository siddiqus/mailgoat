import { Settings } from '../types/models'

/**
 * LocalStorage implementation for Settings Repository
 */
class LocalStorageSettingsRepository {
  private storageKey: string

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
  async saveSettings(settings: Settings) {
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
  _getDefaultSettings(): Settings {
    return {
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
      supabase: {
        url: '',
        key: '',
      },
      pixelTracking: {
        enabled: false, // Enabled by default for backward compatibility
      },
      signature: '',
    }
  }
}

export default LocalStorageSettingsRepository
