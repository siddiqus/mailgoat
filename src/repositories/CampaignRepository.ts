import { v4 as uuidv4 } from 'uuid'
import type { Campaign, CampaignCreateData } from '../types/models'

/**
 * LocalStorage repository for campaigns
 */
class CampaignRepository {
  private storageKey: string

  constructor() {
    this.storageKey = 'MailGoat_campaigns'
  }

  /**
   * Get all campaigns
   * @returns Array of campaign objects
   */
  async getAll(): Promise<Campaign[]> {
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
   * @param id - Campaign ID
   * @returns Campaign object or null
   */
  async getById(id: string): Promise<Campaign | null> {
    const campaigns = await this.getAll()
    return campaigns.find(c => c.id === id) || null
  }

  /**
   * Create a new campaign
   * @param campaignData - Campaign data (name, color)
   * @returns Created campaign
   */
  async create(campaignData: CampaignCreateData): Promise<Campaign> {
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
   * @param id - Campaign ID
   * @param updates - Fields to update
   * @returns Updated campaign or null
   */
  async update(
    id: string,
    updates: Partial<Omit<Campaign, 'id' | 'createdAt'>>
  ): Promise<Campaign | null> {
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
   * @param id - Campaign ID
   * @returns True if deleted successfully
   */
  async delete(id: string): Promise<boolean> {
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
   * @param id - Campaign ID
   * @returns True if incremented successfully
   */
  async incrementEmailCount(id: string): Promise<boolean> {
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
  private _save(campaigns: Campaign[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(campaigns))
    } catch (error) {
      console.error('Error saving campaigns to localStorage:', error)
      throw new Error('Failed to save campaigns')
    }
  }
}

export default CampaignRepository
