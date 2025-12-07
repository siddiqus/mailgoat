import { useState, useEffect } from 'react'
import { sanitizeHtml } from '../utils/sanitizer'
import { validateHTML, extractParameters } from '../utils/templateValidator'
import RichTextEditor from './RichTextEditor'

const CALENDAR_PREDEFINED_PARAMS = ['date', 'startTime', 'endTime', 'timezone', 'durationInMinutes']

function TemplateModal({ show, onHide, onSave, template = null }) {
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

  // Initialize form when template changes (edit mode) or modal opens
  useEffect(() => {
    if (show) {
      if (template) {
        // Edit mode
        setName(template.name || '')
        setType(template.type || 'email')
        setSubject(template.subject || '')
        setHtmlString(template.htmlString || '')
      } else {
        // Create mode
        setName('')
        setType('email')
        setSubject('')
        setHtmlString('')
      }
      setParameters([])
      setValidationErrors([])
      setNameError('')
      setSubjectError('')
      setIsValid(true)
      setShowRawHtml(false)
    }
  }, [show, template])

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

  const handleSave = () => {
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

    const templateData = {
      name: name.trim(),
      type,
      subject: subject.trim(),
      htmlString: htmlString,
      parameters,
    }

    onSave(templateData)
  }

  const handleClose = () => {
    setName('')
    setSubject('')
    setHtmlString('')
    setParameters([])
    setValidationErrors([])
    setNameError('')
    setSubjectError('')
    setIsValid(true)
    onHide()
  }

  if (!show) return null

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{template ? 'Edit Template' : 'Create Template'}</h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label htmlFor="templateType" className="form-label">
                Template Type <span className="text-danger">*</span>
              </label>
              <select
                id="templateType"
                className="form-select"
                value={type}
                onChange={e => setType(e.target.value)}
                disabled={!!template}
              >
                <option value="email">Email</option>
                <option value="calendar">Calendar Invite</option>
              </select>
              {template && (
                <div className="form-text">Template type cannot be changed after creation</div>
              )}
              {!template && type === 'calendar' && (
                <div className="form-text text-info">
                  Calendar templates will automatically include parameters: date, startTime,
                  endTime, timezone, durationInMinutes
                </div>
              )}
            </div>

            <div className="mb-3">
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

            <div className="mb-3">
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
              {subjectError ? (
                <div className="invalid-feedback d-block">{subjectError}</div>
              ) : (
                <div className="form-text">
                  You can use parameters in the subject, e.g., Welcome {'{{name}}'} to our platform
                </div>
              )}
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label htmlFor="htmlString" className="form-label mb-0">
                  Email Content <span className="text-danger">*</span>
                </label>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowRawHtml(!showRawHtml)}
                >
                  {showRawHtml ? '📝 Rich Text Editor' : '🔧 Raw HTML'}
                </button>
              </div>

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
            </div>

            {htmlString && htmlString !== '<p></p>' && (
              <div className="mb-3">
                <label className="form-label">Email Preview</label>
                <div
                  className="border rounded p-3 bg-white"
                  style={{
                    minHeight: '100px',
                    maxHeight: '300px',
                    overflow: 'auto',
                    wordBreak: 'break-word',
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlString) }}
                />
                <div className="form-text">This is how your email will be rendered when sent</div>
              </div>
            )}

            {parameters.length > 0 && (
              <div className="mb-3">
                <label className="form-label">Parameters</label>
                <div className="border rounded p-3 bg-light">
                  <div className="d-flex flex-wrap gap-2">
                    {parameters.map((param, index) => {
                      const isPredefined =
                        type === 'calendar' && CALENDAR_PREDEFINED_PARAMS.includes(param)
                      return (
                        <span
                          key={index}
                          className={`badge fs-6 ${isPredefined ? 'bg-success' : 'bg-secondary'}`}
                          title={isPredefined ? 'Predefined calendar parameter' : ''}
                        >
                          {param}
                          {isPredefined && ' ✓'}
                        </span>
                      )
                    })}
                  </div>
                </div>
                <div className="form-text">
                  {type === 'calendar'
                    ? 'Green badges are predefined calendar parameters. Others are automatically detected from your template.'
                    : 'These parameters were automatically detected from your template'}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={
                !isValid ||
                !htmlString.trim() ||
                htmlString === '<p></p>' ||
                !name.trim() ||
                !subject.trim() ||
                !!nameError ||
                !!subjectError
              }
            >
              {template ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplateModal
