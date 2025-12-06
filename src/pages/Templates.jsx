import { useState, useEffect, useRef } from 'react'
import PageCard from '../components/PageCard'
import PageContainer from '../components/PageContainer'
import TemplateModal from '../components/TemplateModal'
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  exportTemplates,
  importTemplates,
} from '../services/templateRepositoryService'
import { sanitizeHtml } from '../utils/sanitizer'
import './Templates.css'

function Templates() {
  const [templates, setTemplates] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef(null)

  // Load templates on component mount
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const data = await getAllTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
      alert('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClick = () => {
    setEditingTemplate(null)
    setShowModal(true)
  }

  const handleEditClick = template => {
    setEditingTemplate(template)
    setShowModal(true)
  }

  const handleDeleteClick = async id => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      await deleteTemplate(id)
      await loadTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    }
  }

  const handleSave = async templateData => {
    try {
      // Check for duplicate template name
      const isDuplicate = templates.some(
        t =>
          t.name.toLowerCase() === templateData.name.toLowerCase() && t.id !== editingTemplate?.id
      )

      if (isDuplicate) {
        alert(
          `A template with the name "${templateData.name}" already exists. Please choose a different name.`
        )
        return
      }

      if (editingTemplate) {
        // Update existing template
        await updateTemplate(editingTemplate.id, templateData)
      } else {
        // Create new template
        await createTemplate(templateData)
      }
      await loadTemplates()
      setShowModal(false)
      setEditingTemplate(null)
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template')
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingTemplate(null)
  }

  const handleExport = async () => {
    try {
      const jsonData = await exportTemplates()
      const blob = new Blob([jsonData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `templates_export_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting templates:', error)
      alert('Failed to export templates')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = async event => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const result = await importTemplates(text, true) // merge mode

      if (result.errors.length > 0) {
        const errorMsg = `Import completed with warnings:\n\nSuccessfully imported: ${result.success} template(s)\n\nErrors:\n${result.errors.join('\n')}`
        alert(errorMsg)
      } else {
        alert(`Successfully imported ${result.success} template(s)`)
      }

      await loadTemplates()
      // Reset file input
      event.target.value = ''
    } catch (error) {
      console.error('Error importing templates:', error)
      alert(`Failed to import templates: ${error.message}`)
      event.target.value = ''
    }
  }

  return (
    <PageContainer>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Templates</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={handleImportClick}>
            Import Templates
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={handleExport}
            disabled={templates.length === 0}
          >
            Export Templates
          </button>
          <button className="btn btn-primary" onClick={handleCreateClick}>
            Create New Template
          </button>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : templates.length === 0 ? (
        <PageCard>
          <div className="template-empty-state">
            <div className="template-empty-icon">📝</div>
            <h5>No Templates Found</h5>
            <p className="text-muted mb-0">
              Click "Create New Template" to get started with your first email template.
            </p>
          </div>
        </PageCard>
      ) : (
        <div className="templates-grid">
          {templates.map(template => (
            <div key={template.id} className="template-card">
              <div className="template-card-header">
                <h5 className="template-card-title" title={template.name}>
                  {template.name || 'Untitled Template'}
                </h5>
                <div className="template-card-id">ID: {template.id}</div>
              </div>

              <div className="template-card-body">
                {template.subject && (
                  <div className="template-subject-section">
                    <div className="template-subject-label">Subject</div>
                    <div className="template-subject-value">{template.subject}</div>
                  </div>
                )}

                <div className="template-preview-section">
                  <div className="template-preview-label">HTML Preview</div>
                  <div
                    className="template-preview-content"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(template.htmlString) }}
                  />
                </div>

                {template.parameters && template.parameters.length > 0 && (
                  <div className="template-parameters-section">
                    <div className="template-parameters-label">Parameters</div>
                    <div className="template-parameters-list">
                      {template.parameters.map((param, index) => (
                        <span key={index} className="template-parameter-badge">
                          {param}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="template-dates">
                  Created: {new Date(template.createdAt).toLocaleDateString()} • Updated:{' '}
                  {new Date(template.updatedAt).toLocaleDateString()}
                </div>
              </div>

              <div className="template-card-footer">
                <div className="template-actions">
                  <button
                    className="btn btn-sm btn-outline-primary flex-fill"
                    onClick={() => handleEditClick(template)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      fill="currentColor"
                      className="bi bi-pencil me-1"
                      viewBox="0 0 16 16"
                    >
                      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger flex-fill"
                    onClick={() => handleDeleteClick(template.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      fill="currentColor"
                      className="bi bi-trash me-1"
                      viewBox="0 0 16 16"
                    >
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                      <path
                        fillRule="evenodd"
                        d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplateModal
        show={showModal}
        onHide={handleModalClose}
        onSave={handleSave}
        template={editingTemplate}
      />
    </PageContainer>
  )
}

export default Templates
