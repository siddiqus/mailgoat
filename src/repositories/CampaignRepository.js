import { v4 as uuidv4 } from 'uuid'

/**
 * LocalStorage repository for campaigns
 */
class CampaignRepository {
  constructor() {
    this.storageKey = 'MailGoat_campaigns'
  }

  /**
   * Get all campaigns
   * @returns {Promise<Array>} Array of campaign objects
   */
  async getAll() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error reading campaigns from localStorage:', error)
      return []
    }
  }

  /**
   * Get a single campaign by ID
   * @param {string} id - Campaign ID
   * @returns {Promise<Object|null>} Campaign object or null
   */
  async getById(id) {
    const campaigns = await this.getAll()
    return campaigns.find(c => c.id === id) || null
  }

  /**
   * Create a new campaign
   * @param {Object} campaignData - Campaign data (name, color)
   * @returns {Promise<Object>} Created campaign
   */
  async create(campaignData) {
    const campaigns = await this.getAll()
    const newCampaign = {
      id: uuidv4(),
      name: campaignData.name,
      color: campaignData.color || '#0d6efd', // Default to Bootstrap primary blue
      createdAt: new Date().toISOString(),
      emailCount: 0, // Track number of emails sent in this campaign
    }
    campaigns.unshift(newCampaign) // Add to beginning of array
    this._save(campaigns)
    return newCampaign
  }

  /**
   * Update a campaign
   * @param {string} id - Campaign ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated campaign or null
   */
  async update(id, updates) {
    const campaigns = await this.getAll()
    const index = campaigns.findIndex(c => c.id === id)

    if (index === -1) {
      return null
    }

    campaigns[index] = {
      ...campaigns[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    }

    this._save(campaigns)
    return campaigns[index]
  }

  /**
   * Delete a campaign
   * @param {string} id - Campaign ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async delete(id) {
    const campaigns = await this.getAll()
    const filteredCampaigns = campaigns.filter(c => c.id !== id)

    if (filteredCampaigns.length === campaigns.length) {
      return false // Campaign not found
    }

    this._save(filteredCampaigns)
    return true
  }

  /**
   * Increment email count for a campaign
   * @param {string} id - Campaign ID
   * @returns {Promise<boolean>} True if incremented successfully
   */
  async incrementEmailCount(id) {
    const campaigns = await this.getAll()
    const index = campaigns.findIndex(c => c.id === id)

    if (index === -1) {
      return false
    }

    campaigns[index].emailCount = (campaigns[index].emailCount || 0) + 1
    this._save(campaigns)
    return true
  }

  /**
   * Save campaigns to localStorage
   * @private
   */
  _save(campaigns) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(campaigns))
    } catch (error) {
      console.error('Error saving campaigns to localStorage:', error)
      throw new Error('Failed to save campaigns')
    }
  }
}

export default CampaignRepository
