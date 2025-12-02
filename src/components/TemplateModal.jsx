import React, { useState, useEffect } from 'react'
import { validateHTML, extractParameters } from '../utils/templateValidator'

function TemplateModal({ show, onHide, onSave, template = null }) {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [htmlString, setHtmlString] = useState('')
  const [parameters, setParameters] = useState([])
  const [validationErrors, setValidationErrors] = useState([])
  const [nameError, setNameError] = useState('')
  const [isValid, setIsValid] = useState(true)

  // Convert line breaks to <br> tags
  const processHtmlString = (html) => {
    if (!html) return ''
    // Replace newlines with <br> tags
    return html.replace(/\n/g, '<br>')
  }

  // Initialize form when template changes (edit mode) or modal opens
  useEffect(() => {
    if (show) {
      if (template) {
        // Edit mode
        setName(template.name || '')
        setSubject(template.subject || '')
        setHtmlString(template.htmlString || '')
      } else {
        // Create mode
        setName('')
        setSubject('')
        setHtmlString('')
      }
      setParameters([])
      setValidationErrors([])
      setNameError('')
      setIsValid(true)
    }
  }, [show, template])

  // Validate and extract parameters whenever HTML string or subject changes
  useEffect(() => {
    if (htmlString.trim() === '' && subject.trim() === '') {
      setParameters([])
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
    const allParams = [...new Set([...subjectParams, ...htmlParams])]
    setParameters(allParams)
  }, [htmlString, subject])

  const validateName = (nameValue) => {
    const trimmedName = nameValue.trim()
    if (!trimmedName) {
      setNameError('Template name cannot be empty or contain only spaces')
      return false
    }
    setNameError('')
    return true
  }

  const handleNameChange = (e) => {
    const newName = e.target.value
    setName(newName)
    if (newName) {
      validateName(newName)
    } else {
      setNameError('')
    }
  }

  const handleSave = () => {
    // Validate name
    const isNameValid = validateName(name)

    // Validate HTML
    if (!htmlString.trim()) {
      setValidationErrors(['HTML string cannot be empty'])
      setIsValid(false)
      return
    }

    if (!isValid || !isNameValid) {
      return
    }

    // Process HTML string to convert line breaks to <br> tags
    const processedHtmlString = processHtmlString(htmlString)

    const templateData = {
      name: name.trim(),
      subject: subject.trim(),
      htmlString: processedHtmlString,
      parameters
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
    setIsValid(true)
    onHide()
  }

  if (!show) return null

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {template ? 'Edit Template' : 'Create Template'}
            </h5>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
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
              {nameError && (
                <div className="invalid-feedback d-block">
                  {nameError}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="subject" className="form-label">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                className="form-control"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject (can include {{parameters}})"
              />
              <div className="form-text">
                You can use parameters in the subject, e.g., Welcome {'{{name}}'} to our platform
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="htmlString" className="form-label">
                HTML String <span className="text-danger">*</span>
              </label>
              <textarea
                id="htmlString"
                className={`form-control ${!isValid && htmlString ? 'is-invalid' : ''}`}
                rows="10"
                value={htmlString}
                onChange={(e) => setHtmlString(e.target.value)}
                placeholder="Enter your HTML template here. Use {{parameterName}} for dynamic values."
              />
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
              <div className="form-text">
                Use double curly braces for parameters, e.g., {'{{name}}'}, {'{{email}}'}
              </div>
            </div>

            {htmlString && (
              <div className="mb-3">
                <label className="form-label">HTML Preview</label>
                <div
                  className="border rounded p-3 bg-white"
                  style={{
                    minHeight: '100px',
                    maxHeight: '300px',
                    overflow: 'auto',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}
                  dangerouslySetInnerHTML={{ __html: processHtmlString(htmlString) }}
                />
                <div className="form-text">
                  This is how your HTML will be rendered (line breaks will be preserved)
                </div>
              </div>
            )}

            {parameters.length > 0 && (
              <div className="mb-3">
                <label className="form-label">Detected Parameters</label>
                <div className="border rounded p-3 bg-light">
                  <div className="d-flex flex-wrap gap-2">
                    {parameters.map((param, index) => (
                      <span key={index} className="badge bg-secondary fs-6">
                        {param}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="form-text">
                  These parameters were automatically detected from your HTML template
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
              disabled={!isValid || !htmlString.trim() || !name.trim() || !!nameError}
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
