import LocalStorageTemplateRepository from '../repositories/LocalStorageTemplateRepository'

const templateRepository = new LocalStorageTemplateRepository()

/**
 * Get all templates
 * @returns {Promise<Array>} Array of templates
 */
export const getAllTemplates = async () => {
  return await templateRepository.getAll()
}

/**
 * Get template by ID
 * @param {string} id - Template ID
 * @returns {Promise<Object|null>} Template or null
 */
export const getTemplateById = async (id) => {
  return await templateRepository.getById(id)
}

/**
 * Create new template
 * @param {Object} templateData - Template data
 * @returns {Promise<Object>} Created template
 */
export const createTemplate = async (templateData) => {
  return await templateRepository.create(templateData)
}

/**
 * Update existing template
 * @param {string} id - Template ID
 * @param {Object} templateData - Updated template data
 * @returns {Promise<Object>} Updated template
 */
export const updateTemplate = async (id, templateData) => {
  return await templateRepository.update(id, templateData)
}

/**
 * Delete template
 * @param {string} id - Template ID
 * @returns {Promise<boolean>} True if deleted
 */
export const deleteTemplate = async (id) => {
  return await templateRepository.delete(id)
}
