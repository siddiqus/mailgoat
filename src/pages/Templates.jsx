import { useState, useEffect, useRef } from 'react'
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
    <div className="container mt-5">
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
        <div className="alert alert-info">
          No templates found. Click "Create New Template" to get started.
        </div>
      ) : (
        <div className="row">
          {templates.map(template => (
            <div key={template.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title text-primary">
                    {template.name || 'Untitled Template'}
                  </h5>

                  <div className="mb-2">
                    <div className="text-muted small font-monospace">
                      <small className="text-muted">ID: </small>
                      {template.id}
                    </div>
                  </div>

                  {template.subject && (
                    <div className="mb-2">
                      <small className="text-muted">Subject:</small>
                      <div className="mt-1 fw-medium">{template.subject}</div>
                    </div>
                  )}

                  <div className="mb-3">
                    <small className="text-muted">HTML Preview:</small>
                    <div
                      className="border rounded p-2 mt-1 bg-white"
                      style={{
                        maxHeight: '150px',
                        overflow: 'auto',
                        fontSize: '0.9rem',
                        whiteSpace: 'pre-wrap',
                      }}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(template.htmlString) }}
                    />
                  </div>

                  {template.parameters && template.parameters.length > 0 && (
                    <div className="mb-3">
                      <small className="text-muted">Parameters:</small>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {template.parameters.map((param, index) => (
                          <span key={index} className="badge bg-secondary">
                            {param}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-muted small">
                    <div>
                      Created: {new Date(template.createdAt).toLocaleDateString()}, Updated:{' '}
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-white">
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-primary flex-fill"
                      onClick={() => handleEditClick(template)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger flex-fill"
                      onClick={() => handleDeleteClick(template.id)}
                    >
                      Delete
                    </button>
                  </div>
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
    </div>
  )
}

export default Templates
