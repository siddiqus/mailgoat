import LocalStorageTemplateRepository from '../repositories/LocalStorageTemplateRepository'
import type { Template, TemplateCreateData, ImportResult } from '../types/models'

const templateRepository = new LocalStorageTemplateRepository()

// Run migration on module load to ensure backward compatibility
// This adds the 'type' field to existing templates, defaulting to 'email'
templateRepository.migrateTemplates().catch(error => {
  console.error('Failed to migrate templates:', error)
})

/**
 * Get all templates
 * @returns Array of templates
 */
export const getAllTemplates = async (): Promise<Template[]> => {
  return await templateRepository.getAll()
}

/**
 * Get template by ID
 * @param id - Template ID
 * @returns Template or null
 */
export const getTemplateById = async (id: string): Promise<Template | null> => {
  return await templateRepository.getById(id)
}

/**
 * Create new template
 * @param templateData - Template data
 * @returns Created template
 */
export const createTemplate = async (templateData: TemplateCreateData): Promise<Template> => {
  return await templateRepository.create(templateData)
}

/**
 * Update existing template
 * @param id - Template ID
 * @param templateData - Updated template data
 * @returns Updated template
 */
export const updateTemplate = async (
  id: string,
  templateData: Partial<TemplateCreateData>
): Promise<Template> => {
  return await templateRepository.update(id, templateData)
}

/**
 * Delete template
 * @param id - Template ID
 * @returns True if deleted
 */
export const deleteTemplate = async (id: string): Promise<boolean> => {
  return await templateRepository.delete(id)
}

/**
 * Export all templates to JSON
 * @returns JSON string of all templates
 */
export const exportTemplates = async (): Promise<string> => {
  const templates = await templateRepository.getAll()
  return JSON.stringify(templates, null, 2)
}

/**
 * Import templates from JSON
 * @param jsonString - JSON string containing templates
 * @param merge - If true, merge with existing templates. If false, replace all templates.
 * @returns Object with success count and any errors
 */
export const importTemplates = async (
  jsonString: string,
  merge: boolean = true
): Promise<ImportResult> => {
  try {
    const importedTemplates = JSON.parse(jsonString) as unknown[]

    if (!Array.isArray(importedTemplates)) {
      throw new Error('Invalid format: JSON must contain an array of templates')
    }

    const existingTemplates = merge ? await templateRepository.getAll() : []
    const errors: string[] = []
    let successCount = 0

    // Validate each template
    for (let i = 0; i < importedTemplates.length; i++) {
      const template = importedTemplates[i] as Partial<Template>

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
        t => t.name.toLowerCase() === template.name!.toLowerCase()
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
      const t = template as Partial<Template>
      return (
        t.name &&
        t.htmlString &&
        (!merge ||
          !existingTemplates.some(
            existing => existing.name.toLowerCase() === t.name!.toLowerCase()
          ))
      )
    })

    // Create templates one by one
    for (const template of validTemplates) {
      const t = template as Partial<Template>
      await templateRepository.create({
        name: t.name!,
        type: t.type || 'email', // Default to 'email' for backwards compatibility
        subject: t.subject || '',
        htmlString: t.htmlString!,
        parameters: t.parameters || [],
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
