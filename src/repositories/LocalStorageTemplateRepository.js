import { v4 as uuidv4 } from 'uuid'
import ITemplateRepository from './ITemplateRepository'

/**
 * LocalStorage implementation of the Template Repository
 */
class LocalStorageTemplateRepository extends ITemplateRepository {
  constructor() {
    super()
    this.storageKey = 'MailGoat_templates'
  }

  /**
   * Get all templates from localStorage
   * @returns {Promise<Array>} Array of template objects
   */
  async getAll() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error reading templates from localStorage:', error)
      return []
    }
  }

  /**
   * Get a template by ID
   * @param {string} id - Template ID
   * @returns {Promise<Object|null>} Template object or null if not found
   */
  async getById(id) {
    const templates = await this.getAll()
    return templates.find(t => t.id === id) || null
  }

  /**
   * Create a new template
   * @param {Object} template - Template object without ID
   * @returns {Promise<Object>} Created template with ID
   */
  async create(template) {
    const templates = await this.getAll()
    const newTemplate = {
      ...template,
      id: this._generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    templates.push(newTemplate)
    this._save(templates)
    return newTemplate
  }

  /**
   * Update an existing template
   * @param {string} id - Template ID
   * @param {Object} template - Updated template data
   * @returns {Promise<Object>} Updated template
   */
  async update(id, template) {
    const templates = await this.getAll()
    const index = templates.findIndex(t => t.id === id)

    if (index === -1) {
      throw new Error(`Template with id ${id} not found`)
    }

    const updatedTemplate = {
      ...templates[index],
      ...template,
      id, // Preserve the original ID
      updatedAt: new Date().toISOString(),
    }

    templates[index] = updatedTemplate
    this._save(templates)
    return updatedTemplate
  }

  /**
   * Delete a template
   * @param {string} id - Template ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async delete(id) {
    const templates = await this.getAll()
    const filteredTemplates = templates.filter(t => t.id !== id)

    if (filteredTemplates.length === templates.length) {
      return false // Template not found
    }

    this._save(filteredTemplates)
    return true
  }

  /**
   * Save templates to localStorage
   * @private
   */
  _save(templates) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(templates))
    } catch (error) {
      console.error('Error saving templates to localStorage:', error)
      throw new Error('Failed to save templates')
    }
  }

  /**
   * Generate a unique ID using UUID v4
   * @private
   */
  _generateId() {
    return uuidv4()
  }
}

export default LocalStorageTemplateRepository
