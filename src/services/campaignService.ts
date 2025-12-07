import CampaignRepository from '../repositories/CampaignRepository'
import type { Campaign } from '../types/models'

const campaignRepository = new CampaignRepository()

/**
 * Get all campaigns
 * @returns Array of campaigns
 */
export const getAllCampaigns = async (): Promise<Campaign[]> => {
  return await campaignRepository.getAll()
}

/**
 * Get a single campaign by ID
 * @param id - Campaign ID
 * @returns Campaign or null
 */
export const getCampaignById = async (id: string): Promise<Campaign | null> => {
  return await campaignRepository.getById(id)
}

/**
 * Create a new campaign
 * @param name - Campaign name
 * @param color - Campaign color (hex code)
 * @returns Created campaign
 */
export const createCampaign = async (
  name: string,
  color: string = '#0d6efd'
): Promise<Campaign> => {
  if (!name || !name.trim()) {
    throw new Error('Campaign name is required')
  }

  return await campaignRepository.create({ name: name.trim(), color })
}

/**
 * Update a campaign
 * @param id - Campaign ID
 * @param updates - Fields to update
 * @returns Updated campaign or null
 */
export const updateCampaign = async (
  id: string,
  updates: Partial<Omit<Campaign, 'id' | 'createdAt'>>
): Promise<Campaign | null> => {
  return await campaignRepository.update(id, updates)
}

/**
 * Delete a campaign
 * @param id - Campaign ID
 * @returns True if deleted successfully
 */
export const deleteCampaign = async (id: string): Promise<boolean> => {
  return await campaignRepository.delete(id)
}

/**
 * Increment email count for a campaign
 * @param id - Campaign ID
 * @returns True if incremented successfully
 */
export const incrementCampaignEmailCount = async (id: string): Promise<boolean> => {
  if (!id) return false
  return await campaignRepository.incrementEmailCount(id)
}
