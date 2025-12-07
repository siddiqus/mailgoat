import { v4 as uuidv4 } from 'uuid'
import type { Template, TemplateCreateData } from '../types/models'

/**
 * LocalStorage implementation of the Template Repository
 */
class LocalStorageTemplateRepository {
  private storageKey: string

  constructor() {
    this.storageKey = 'MailGoat_templates'
  }

  /**
   * Get all templates from localStorage
   * @returns Array of template objects
   */
  async getAll(): Promise<Template[]> {
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
   * @param id - Template ID
   * @returns Template object or null if not found
   */
  async getById(id: string): Promise<Template | null> {
    const templates = await this.getAll()
    return templates.find(t => t.id === id) || null
  }

  /**
   * Create a new template
   * @param template - Template object without ID
   * @returns Created template with ID
   */
  async create(template: TemplateCreateData): Promise<Template> {
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
   * @param id - Template ID
   * @param template - Updated template data
   * @returns Updated template
   */
  async update(id: string, template: Partial<TemplateCreateData>): Promise<Template> {
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
   * @param id - Template ID
   * @returns True if deleted successfully
   */
  async delete(id: string): Promise<boolean> {
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
  private _save(templates: Template[]): void {
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
  private _generateId(): string {
    return uuidv4()
  }
}

export default LocalStorageTemplateRepository
