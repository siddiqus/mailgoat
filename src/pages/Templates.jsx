import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PageCard from '../components/PageCard'
import PageContainer from '../components/PageContainer'
import TemplateViewModal from '../components/TemplateViewModal'
import { useAlert } from '../contexts/AlertContext'
import {
  getAllTemplates,
  deleteTemplate,
  exportTemplates,
  importTemplates,
} from '../services/templateRepositoryService'

function Templates() {
  const navigate = useNavigate()
  const { showAlert, showConfirm } = useAlert()
  const [templates, setTemplates] = useState([])
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingTemplate, setViewingTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all') // 'all', 'email', 'calendar'
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
      showAlert({
        title: 'Error',
        message: 'Failed to load templates',
        type: 'danger',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClick = () => {
    navigate('/templates/new')
  }

  const handleViewClick = template => {
    setViewingTemplate(template)
    setShowViewModal(true)
  }

  const handleEditClick = template => {
    navigate(`/templates/edit/${template.id}`)
  }

  const handleDeleteClick = async id => {
    const confirmed = await showConfirm({
      title: 'Delete Template',
      message: 'Are you sure you want to delete this template? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    })

    if (!confirmed) return

    try {
      await deleteTemplate(id)
      await loadTemplates()
      showAlert({
        title: 'Success',
        message: 'Template deleted successfully',
        type: 'success',
      })
    } catch (error) {
      console.error('Error deleting template:', error)
      showAlert({
        title: 'Error',
        message: 'Failed to delete template',
        type: 'danger',
      })
    }
  }

  const handleViewModalClose = () => {
    setShowViewModal(false)
    setViewingTemplate(null)
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
      showAlert({
        title: 'Error',
        message: 'Failed to export templates',
        type: 'danger',
      })
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
        const errorList = result.errors.map(err => `• ${err}`).join('\n')
        showAlert({
          title: 'Import Completed with Warnings',
          message: `Successfully imported: ${result.success} template(s)\n\nErrors:\n${errorList}`,
          type: 'warning',
        })
      } else {
        showAlert({
          title: 'Success',
          message: `Successfully imported ${result.success} template(s)`,
          type: 'success',
        })
      }

      await loadTemplates()
      // Reset file input
      event.target.value = ''
    } catch (error) {
      console.error('Error importing templates:', error)
      showAlert({
        title: 'Import Failed',
        message: `Failed to import templates: ${error.message}`,
        type: 'danger',
      })
      event.target.value = ''
    }
  }

  const formatDate = dateString => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const filteredTemplates = templates.filter(template => {
    if (filterType === 'all') return true
    return template.type === filterType
  })

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Templates</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={handleImportClick}>
            Import
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={handleExport}
            disabled={templates.length === 0}
          >
            Export
          </button>
          <button className="btn btn-primary" onClick={handleCreateClick}>
            Create Template
          </button>
        </div>
      </div>

      {/* Filter buttons */}
      <div className="mb-3">
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilterType('all')}
          >
            All ({templates.length})
          </button>
          <button
            type="button"
            className={`btn ${filterType === 'email' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilterType('email')}
          >
            Email ({templates.filter(t => t.type === 'email').length})
          </button>
          <button
            type="button"
            className={`btn ${filterType === 'calendar' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilterType('calendar')}
          >
            Calendar ({templates.filter(t => t.type === 'calendar').length})
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

      {/* Templates List */}
      <PageCard className="p-0">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              fill="currentColor"
              className="bi bi-file-earmark-text mb-3"
              viewBox="0 0 16 16"
            >
              <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z" />
              <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z" />
            </svg>
            <p className="mb-0">
              {templates.length === 0
                ? 'No templates yet. Create your first template above!'
                : `No ${filterType} templates found.`}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Template Name</th>
                  <th style={{ width: '10%' }}>Type</th>
                  <th style={{ width: '30%' }}>Subject</th>
                  <th style={{ width: '15%' }}>Created</th>
                  <th style={{ width: '20%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map(template => (
                  <tr key={template.id}>
                    <td className="align-middle">{template.name || 'Untitled Template'}</td>
                    <td className="align-middle">
                      <span
                        className={`badge ${template.type === 'email' ? 'bg-primary' : 'bg-success'}`}
                      >
                        {template.type === 'email' ? 'Email' : 'Calendar'}
                      </span>
                    </td>
                    <td className="align-middle">
                      <span className="text-muted">{template.subject}</span>
                    </td>
                    <td className="align-middle text-muted small">
                      {formatDate(template.createdAt)}
                    </td>
                    <td className="align-middle">
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleViewClick(template)}
                          title="View template"
                        >
                          View
                        </button>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => handleEditClick(template)}
                          title="Edit template"
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteClick(template.id)}
                          title="Delete template"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>

      {/* View Modal */}
      <TemplateViewModal
        show={showViewModal}
        onHide={handleViewModalClose}
        template={viewingTemplate}
      />
    </PageContainer>
  )
}

export default Templates
