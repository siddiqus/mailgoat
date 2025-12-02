/**
 * Template Repository Interface
 * This interface defines the contract for template storage operations
 */
class ITemplateRepository {
  /**
   * Get all templates
   * @returns {Promise<Array>} Array of template objects
   */
  async getAll() {
    throw new Error('Method not implemented')
  }

  /**
   * Get a template by ID
   * @param {string} id - Template ID
   * @returns {Promise<Object|null>} Template object or null if not found
   */
  async getById(id) {
    throw new Error('Method not implemented')
  }

  /**
   * Create a new template
   * @param {Object} template - Template object without ID
   * @returns {Promise<Object>} Created template with ID
   */
  async create(template) {
    throw new Error('Method not implemented')
  }

  /**
   * Update an existing template
   * @param {string} id - Template ID
   * @param {Object} template - Updated template data
   * @returns {Promise<Object>} Updated template
   */
  async update(id, template) {
    throw new Error('Method not implemented')
  }

  /**
   * Delete a template
   * @param {string} id - Template ID
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async delete(id) {
    throw new Error('Method not implemented')
  }
}

export default ITemplateRepository
