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
export const getTemplateById = async id => {
  return await templateRepository.getById(id)
}

/**
 * Create new template
 * @param {Object} templateData - Template data
 * @returns {Promise<Object>} Created template
 */
export const createTemplate = async templateData => {
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
export const deleteTemplate = async id => {
  return await templateRepository.delete(id)
}

/**
 * Export all templates to JSON
 * @returns {Promise<string>} JSON string of all templates
 */
export const exportTemplates = async () => {
  const templates = await templateRepository.getAll()
  return JSON.stringify(templates, null, 2)
}

/**
 * Import templates from JSON
 * @param {string} jsonString - JSON string containing templates
 * @param {boolean} merge - If true, merge with existing templates. If false, replace all templates.
 * @returns {Promise<Object>} Object with success count and any errors
 */
export const importTemplates = async (jsonString, merge = true) => {
  try {
    const importedTemplates = JSON.parse(jsonString)

    if (!Array.isArray(importedTemplates)) {
      throw new Error('Invalid format: JSON must contain an array of templates')
    }

    const existingTemplates = merge ? await templateRepository.getAll() : []
    const errors = []
    let successCount = 0

    // Validate each template
    for (let i = 0; i < importedTemplates.length; i++) {
      const template = importedTemplates[i]

      if (!template.name) {
        errors.push(`Template ${i + 1}: Missing required field 'name'`)
        continue
      }

      if (!template.htmlString) {
        errors.push(`Template ${i + 1}: Missing required field 'htmlString'`)
        continue
      }

      // Check for duplicate names in existing templates
      const isDuplicate = existingTemplates.some(
        t => t.name.toLowerCase() === template.name.toLowerCase()
      )

      if (isDuplicate && merge) {
        errors.push(`Template "${template.name}": A template with this name already exists`)
        continue
      }

      successCount++
    }

    if (errors.length > 0 && successCount === 0) {
      return { success: 0, errors }
    }

    // If validation passed, import templates
    const validTemplates = importedTemplates.filter(template => {
      return (
        template.name &&
        template.htmlString &&
        (!merge ||
          !existingTemplates.some(t => t.name.toLowerCase() === template.name.toLowerCase()))
      )
    })

    // Create templates one by one
    for (const template of validTemplates) {
      await templateRepository.create({
        name: template.name,
        subject: template.subject || '',
        htmlString: template.htmlString,
        parameters: template.parameters || [],
      })
    }

    return { success: successCount, errors }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format')
    }
    throw error
  }
}
