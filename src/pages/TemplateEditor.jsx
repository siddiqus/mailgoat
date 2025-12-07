import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageCard from '../components/PageCard'
import PageContainer from '../components/PageContainer'
import RichTextEditor from '../components/RichTextEditor'
import { useAlert } from '../contexts/AlertContext'
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
} from '../services/templateRepositoryService'
import { sanitizeHtml } from '../utils/sanitizer'
import { validateHTML, extractParameters } from '../utils/templateValidator'

const CALENDAR_PREDEFINED_PARAMS = ['date', 'startTime', 'endTime', 'timezone', 'durationInMinutes']

function TemplateEditor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { showAlert } = useAlert()
  const isEditMode = !!id

  const [name, setName] = useState('')
  const [type, setType] = useState('email')
  const [subject, setSubject] = useState('')
  const [htmlString, setHtmlString] = useState('')
  const [parameters, setParameters] = useState([])
  const [validationErrors, setValidationErrors] = useState([])
  const [nameError, setNameError] = useState('')
  const [subjectError, setSubjectError] = useState('')
  const [isValid, setIsValid] = useState(true)
  const [showRawHtml, setShowRawHtml] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState([])

  // Load template data and existing templates on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const allTemplates = await getAllTemplates()
        setTemplates(allTemplates)

        if (isEditMode) {
          const template = allTemplates.find(t => t.id === id)
          if (template) {
            setName(template.name || '')
            setType(template.type || 'email')
            setSubject(template.subject || '')
            setHtmlString(template.htmlString || '')
          } else {
            showAlert({
              title: 'Error',
              message: 'Template not found',
              type: 'danger',
            })
            navigate('/templates')
          }
        }
      } catch (error) {
        console.error('Error loading templates:', error)
        showAlert({
          title: 'Error',
          message: 'Failed to load templates',
          type: 'danger',
        })
        navigate('/templates')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, isEditMode, navigate, showAlert])

  // Validate and extract parameters whenever HTML string, subject, or type changes
  useEffect(() => {
    if (htmlString.trim() === '' && subject.trim() === '') {
      // For calendar templates, always include predefined parameters
      setParameters(type === 'calendar' ? [...CALENDAR_PREDEFINED_PARAMS] : [])
      setValidationErrors([])
      setIsValid(true)
      return
    }

    // Validate HTML
    const validation = validateHTML(htmlString)
    setIsValid(validation.isValid)
    setValidationErrors(validation.errors)

    // Extract parameters from both subject and HTML
    const htmlParams = extractParameters(htmlString)
    const subjectParams = extractParameters(subject)
    const extractedParams = [...new Set([...subjectParams, ...htmlParams])]

    // For calendar templates, always include predefined parameters
    if (type === 'calendar') {
      const allParams = [...new Set([...CALENDAR_PREDEFINED_PARAMS, ...extractedParams])]
      setParameters(allParams)
    } else {
      setParameters(extractedParams)
    }
  }, [htmlString, subject, type])

  const validateName = nameValue => {
    const trimmedName = nameValue.trim()
    if (!trimmedName) {
      setNameError('Template name cannot be empty or contain only spaces')
      return false
    }
    setNameError('')
    return true
  }

  const handleNameChange = e => {
    const newName = e.target.value
    setName(newName)
    if (newName) {
      validateName(newName)
    } else {
      setNameError('')
    }
  }

  const validateSubject = subjectValue => {
    const trimmedSubject = subjectValue.trim()
    if (!trimmedSubject) {
      setSubjectError('Subject is required')
      return false
    }
    setSubjectError('')
    return true
  }

  const handleSubjectChange = e => {
    const newSubject = e.target.value
    setSubject(newSubject)
    if (newSubject) {
      validateSubject(newSubject)
    } else {
      setSubjectError('')
    }
  }

  const handleSave = async () => {
    // Validate name
    const isNameValid = validateName(name)

    // Validate subject
    const isSubjectValid = validateSubject(subject)

    // Validate HTML
    if (!htmlString.trim() || htmlString === '<p></p>') {
      setValidationErrors(['HTML content cannot be empty'])
      setIsValid(false)
      return
    }

    if (!isValid || !isNameValid || !isSubjectValid) {
      return
    }

    try {
      // Check for duplicate template name
      const isDuplicate = templates.some(
        t => t.name.toLowerCase() === name.trim().toLowerCase() && t.id !== id
      )

      if (isDuplicate) {
        showAlert({
          title: 'Duplicate Name',
          message: `A template with the name "${name.trim()}" already exists. Please choose a different name.`,
          type: 'warning',
        })
        return
      }

      const templateData = {
        name: name.trim(),
        type,
        subject: subject.trim(),
        htmlString: htmlString,
        parameters,
      }

      if (isEditMode) {
        await updateTemplate(id, templateData)
        showAlert({
          title: 'Success',
          message: 'Template updated successfully',
          type: 'success',
        })
      } else {
        await createTemplate(templateData)
        showAlert({
          title: 'Success',
          message: 'Template created successfully',
          type: 'success',
        })
      }

      navigate('/templates')
    } catch (error) {
      console.error('Error saving template:', error)
      showAlert({
        title: 'Error',
        message: 'Failed to save template',
        type: 'danger',
      })
    }
  }

  const handleCancel = () => {
    navigate('/templates')
  }

  const canSave =
    isValid &&
    htmlString.trim() &&
    htmlString !== '<p></p>' &&
    name.trim() &&
    subject.trim() &&
    !nameError &&
    !subjectError

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
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{isEditMode ? 'Edit Template' : 'Create Template'}</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!canSave}>
            {isEditMode ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <PageCard className="mb-4">
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label htmlFor="templateType" className="form-label">
                  Template Type <span className="text-danger">*</span>
                </label>
                <select
                  id="templateType"
                  className="form-select"
                  value={type}
                  onChange={e => setType(e.target.value)}
                  disabled={isEditMode}
                >
                  <option value="email">Email</option>
                  <option value="calendar">Calendar Invite</option>
                </select>
                {!isEditMode && type === 'calendar' && (
                  <div className="form-text text-info">
                    Calendar templates will automatically include parameters: date, startTime,
                    endTime, timezone, durationInMinutes
                  </div>
                )}
              </div>

              <div className="col-md-8">
                <label htmlFor="templateName" className="form-label">
                  Template Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="templateName"
                  className={`form-control ${nameError ? 'is-invalid' : ''}`}
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Enter a descriptive name for your template"
                />
                {nameError && <div className="invalid-feedback d-block">{nameError}</div>}
              </div>
            </div>
            <div className="row">
              <div className="col-md-12">
                <label htmlFor="subject" className="form-label">
                  Subject <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  className={`form-control ${subjectError ? 'is-invalid' : ''}`}
                  value={subject}
                  onChange={handleSubjectChange}
                  placeholder="Enter email subject (can include {{parameters}})"
                />
                {subjectError ? <div className="invalid-feedback d-block">{subjectError}</div> : ''}
              </div>
            </div>
          </PageCard>
        </div>
        <div className="col-md-6">
          {parameters.length > 0 && (
            <PageCard className="mb-4">
              <h5 className="mb-3">Parameters</h5>
              <div className="mb-0">
                <div className="border rounded p-3 bg-light">
                  <div className="d-flex flex-wrap gap-2">
                    {parameters.map((param, index) => {
                      const isPredefined =
                        type === 'calendar' && CALENDAR_PREDEFINED_PARAMS.includes(param)
                      return (
                        <span
                          key={index}
                          className={`badge fs-8 ${isPredefined ? 'bg-success' : 'bg-secondary'}`}
                          title={isPredefined ? 'Predefined calendar parameter' : ''}
                        >
                          {param}
                          {isPredefined && ' ✓'}
                        </span>
                      )
                    })}
                  </div>
                </div>
                <div className="form-text mt-2">
                  {type === 'calendar'
                    ? 'Green badges are predefined. Others are automatically detected from content.'
                    : 'These parameters were automatically detected from content'}
                </div>
              </div>
            </PageCard>
          )}
        </div>
      </div>

      <PageCard className="mb-4">
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label htmlFor="htmlString" className="form-label mb-0">
              <h5>
                {showPreview ? 'Template Preview' : 'Content'}{' '}
                <span className="text-danger">*</span>
              </h5>
            </label>
            <div className="d-flex gap-2">
              {/* <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowRawHtml(!showRawHtml)}
              >
                {showRawHtml ? 'Rich Text Editor' : 'Raw HTML'}
              </button> */}
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Show Content' : 'Show Preview'}
              </button>
            </div>
          </div>

          {showPreview ? (
            // Preview Mode
            htmlString && htmlString !== '<p></p>' ? (
              <div className="mb-0">
                <div
                  className="border rounded p-3 bg-white"
                  style={{
                    minHeight: '400px',
                    maxHeight: '400px',
                    overflow: 'auto',
                    wordBreak: 'break-word',
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlString) }}
                />
                <div className="form-text mt-2">
                  This is how your email will be rendered when sent
                </div>
              </div>
            ) : (
              <div className="text-center text-muted py-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  fill="currentColor"
                  className="bi bi-eye-slash mb-3"
                  viewBox="0 0 16 16"
                >
                  <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
                  <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z" />
                  <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z" />
                </svg>
                <p className="mb-0">Start typing to see a preview of your template</p>
              </div>
            )
          ) : (
            // Editor Mode
            <>
              {showRawHtml ? (
                <>
                  <textarea
                    id="htmlString"
                    className={`form-control ${!isValid && htmlString ? 'is-invalid' : ''}`}
                    rows="10"
                    value={htmlString}
                    onChange={e => setHtmlString(e.target.value)}
                    placeholder="Enter your HTML template here. Use {{parameterName}} for dynamic values."
                  />
                  <div className="form-text">
                    Raw HTML mode - Use double curly braces for parameters, e.g., {'{{name}}'},
                    {'{{email}}'}
                  </div>
                </>
              ) : (
                <RichTextEditor
                  value={htmlString}
                  onChange={setHtmlString}
                  placeholder="Start typing your email content..."
                />
              )}

              {!isValid && validationErrors.length > 0 && (
                <div className="invalid-feedback d-block">
                  <strong>Validation Errors:</strong>
                  <ul className="mb-0 mt-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </PageCard>
    </PageContainer>
  )
}

export default TemplateEditor
