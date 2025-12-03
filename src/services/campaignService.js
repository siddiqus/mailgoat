import CampaignRepository from '../repositories/CampaignRepository'

const campaignRepository = new CampaignRepository()

/**
 * Get all campaigns
 * @returns {Promise<Array>} Array of campaigns
 */
export const getAllCampaigns = async () => {
  return await campaignRepository.getAll()
}

/**
 * Get a single campaign by ID
 * @param {string} id - Campaign ID
 * @returns {Promise<Object|null>} Campaign or null
 */
export const getCampaignById = async id => {
  return await campaignRepository.getById(id)
}

/**
 * Create a new campaign
 * @param {string} name - Campaign name
 * @param {string} color - Campaign color (hex code)
 * @returns {Promise<Object>} Created campaign
 */
export const createCampaign = async (name, color = '#0d6efd') => {
  if (!name || !name.trim()) {
    throw new Error('Campaign name is required')
  }

  return await campaignRepository.create({ name: name.trim(), color })
}

/**
 * Update a campaign
 * @param {string} id - Campaign ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated campaign or null
 */
export const updateCampaign = async (id, updates) => {
  return await campaignRepository.update(id, updates)
}

/**
 * Delete a campaign
 * @param {string} id - Campaign ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
export const deleteCampaign = async id => {
  return await campaignRepository.delete(id)
}

/**
 * Increment email count for a campaign
 * @param {string} id - Campaign ID
 * @returns {Promise<boolean>} True if incremented successfully
 */
export const incrementCampaignEmailCount = async id => {
  if (!id) return false
  return await campaignRepository.incrementEmailCount(id)
}
