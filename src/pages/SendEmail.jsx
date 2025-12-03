import { useState, useEffect } from 'react'
import LocalStorageSettingsRepository from '../repositories/LocalStorageSettingsRepository'
import { sendSingleEmail, sendBulkEmails } from '../services/emailService'
import { validateDataRows, parseFile, prepareBulkEmailData } from '../services/fileParsingService'
import { getAllTemplates } from '../services/templateRepositoryService'
import {
  replaceParameters,
  parseEmailList,
  prepareEmailFromTemplate,
  generateSampleCSV,
  downloadCSV,
} from '../services/templateService'
import { validateEmailList } from '../utils/emailValidator'
import { sanitizeHtml } from '../utils/sanitizer'

const settingsRepository = new LocalStorageSettingsRepository()

function SendEmail() {
  const [activeTab, setActiveTab] = useState('single')
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  // Single email state
  const [parameterValues, setParameterValues] = useState({})
  const [recipients, setRecipients] = useState('')
  const [ccList, setCcList] = useState('')
  const [subject, setSubject] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [recipientsError, setRecipientsError] = useState('')
  const [ccListError, setCcListError] = useState('')

  // Bulk email state
  const [bulkTemplate, setBulkTemplate] = useState(null)
  const [bulkInputMode, setBulkInputMode] = useState('file') // 'file' or 'manual'
  const [uploadedFile, setUploadedFile] = useState(null)
  const [fileData, setFileData] = useState([])
  const [fileErrors, setFileErrors] = useState([])
  const [previewIndex, setPreviewIndex] = useState(null)

  // Manual bulk entry state
  const [manualEntries, setManualEntries] = useState([])

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [webhookConfigured, setWebhookConfigured] = useState(false)

  // Load templates and settings on mount
  useEffect(() => {
    loadTemplates()
    loadSettings()
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

  const loadSettings = async () => {
    try {
      const settings = await settingsRepository.getSettings()
      const isConfigured = settings.webhook?.url && settings.webhook.url.trim() !== ''
      setWebhookConfigured(isConfigured)
    } catch (error) {
      console.error('Error loading settings:', error)
      setWebhookConfigured(false)
    }
  }

  // Update preview when template or parameters change
  useEffect(() => {
    if (selectedTemplate) {
      const { subject: newSubject, htmlBody: newHtmlBody } = prepareEmailFromTemplate(
        selectedTemplate,
        parameterValues
      )
      // Only auto-update subject if user hasn't manually edited it
      // We'll set it initially, but allow manual edits
      setSubject(newSubject)
      setHtmlBody(newHtmlBody)
    } else {
      setSubject('')
      setHtmlBody('')
    }
  }, [selectedTemplate, parameterValues])

  const handleTemplateSelect = template => {
    setSelectedTemplate(template)
    // Initialize parameter values
    const initialValues = {}
    if (template.parameters) {
      template.parameters.forEach(param => {
        initialValues[param] = ''
      })
    }
    setParameterValues(initialValues)
  }

  const handleParameterChange = (paramName, value) => {
    setParameterValues(prev => ({
      ...prev,
      [paramName]: value,
    }))
  }

  const handleRecipientsChange = value => {
    setRecipients(value)

    if (value.trim()) {
      const validation = validateEmailList(value)
      if (!validation.isValid) {
        setRecipientsError(`Invalid email(s): ${validation.invalidEmails.join(', ')}`)
      } else {
        setRecipientsError('')
      }
    } else {
      setRecipientsError('')
    }
  }

  const handleCcListChange = value => {
    setCcList(value)

    if (value.trim()) {
      const validation = validateEmailList(value)
      if (!validation.isValid) {
        setCcListError(`Invalid email(s): ${validation.invalidEmails.join(', ')}`)
      } else {
        setCcListError('')
      }
    } else {
      setCcListError('')
    }
  }

  const handleSendEmail = async () => {
    // Validate inputs
    if (!recipients.trim()) {
      alert('Please enter at least one recipient email address')
      return
    }

    // Validate recipients
    const recipientsValidation = validateEmailList(recipients)
    if (!recipientsValidation.isValid) {
      alert(`Invalid recipient email(s): ${recipientsValidation.invalidEmails.join(', ')}`)
      return
    }

    // Validate CC list if provided
    if (ccList.trim()) {
      const ccValidation = validateEmailList(ccList)
      if (!ccValidation.isValid) {
        alert(`Invalid CC email(s): ${ccValidation.invalidEmails.join(', ')}`)
        return
      }
    }

    if (!subject.trim()) {
      alert('Please enter a subject')
      return
    }

    if (!htmlBody.trim()) {
      alert('Email body cannot be empty')
      return
    }

    // Check if any parameters are still unfilled
    const hasUnfilledParams = selectedTemplate?.parameters?.some(
      param => !parameterValues[param] || parameterValues[param].trim() === ''
    )
    if (hasUnfilledParams) {
      const confirmSend = window.confirm('Some parameters are not filled. Do you want to continue?')
      if (!confirmSend) return
    }

    setSending(true)
    try {
      // Parse recipients and CC list
      const recipientList = parseEmailList(recipients)
      const ccListArray = parseEmailList(ccList)

      const emailData = {
        recipients: recipientList,
        ccList: ccListArray,
        subject,
        htmlBody,
      }

      try {
        await sendSingleEmail(emailData, {
          template: selectedTemplate,
        })
        alert('Email sent successfully!')

        // Reset form
        setSelectedTemplate(null)
        setParameterValues({})
        setRecipients('')
        setCcList('')
        setRecipientsError('')
        setCcListError('')
      } catch (error) {
        alert(`Error sending email: ${error.message}`)
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert(`Failed to send email: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  // Bulk email functions
  const handleBulkTemplateSelect = template => {
    setBulkTemplate(template)
    setUploadedFile(null)
    setFileData([])
    setFileErrors([])
    setPreviewIndex(null)
    setManualEntries([])
  }

  const handleAddManualEntry = () => {
    const newEntry = {
      recipient: '',
      cc: '',
    }

    // Add empty fields for each parameter
    if (bulkTemplate?.parameters) {
      bulkTemplate.parameters.forEach(param => {
        newEntry[param] = ''
      })
    }

    setManualEntries([...manualEntries, newEntry])
  }

  const handleRemoveManualEntry = index => {
    const updated = manualEntries.filter((_, i) => i !== index)
    setManualEntries(updated)
  }

  const handleManualEntryChange = (index, field, value) => {
    const updated = [...manualEntries]
    updated[index][field] = value
    setManualEntries(updated)
  }

  const validateManualEntries = () => {
    const errors = []

    manualEntries.forEach((entry, index) => {
      // Validate recipient
      if (!entry.recipient || !entry.recipient.trim()) {
        errors.push(`Row ${index + 1}: Recipient is required`)
      } else {
        const recipientValidation = validateEmailList(entry.recipient)
        if (!recipientValidation.isValid) {
          errors.push(
            `Row ${index + 1}: Invalid recipient email(s): ${recipientValidation.invalidEmails.join(', ')}`
          )
        }
      }

      // Validate CC if provided
      if (entry.cc && entry.cc.trim()) {
        const ccValidation = validateEmailList(entry.cc)
        if (!ccValidation.isValid) {
          errors.push(
            `Row ${index + 1}: Invalid CC email(s): ${ccValidation.invalidEmails.join(', ')}`
          )
        }
      }

      // Validate required parameters
      if (bulkTemplate?.parameters) {
        bulkTemplate.parameters.forEach(param => {
          if (!entry[param] || !entry[param].trim()) {
            errors.push(`Row ${index + 1}: ${param} is required`)
          }
        })
      }
    })

    return errors
  }

  const handleDownloadSampleCSV = () => {
    if (!bulkTemplate) return

    const csvContent = generateSampleCSV(bulkTemplate)
    downloadCSV(csvContent, `${bulkTemplate.name}_template.csv`)
  }

  const handleFileUpload = async event => {
    const file = event.target.files[0]
    if (!file) return

    // Reset all file-related state when a new file is uploaded
    setUploadedFile(null)
    setFileData([])
    setFileErrors([])
    setPreviewIndex(null)

    try {
      const data = await parseFile(file)
      const errors = validateDataRows(data, bulkTemplate?.parameters)

      // Only set the file data if parsing succeeds
      setUploadedFile(file)
      setFileData(data)
      setFileErrors(errors)

      if (errors.length > 0) {
        alert(
          `File validation failed with ${errors.length} error(s). Please check the errors below.`
        )
      }
    } catch (error) {
      alert(`Error parsing file: ${error.message}`)
      // Reset file input so user can select the same file again
      event.target.value = ''
    }
  }

  const getPreviewData = rowData => {
    if (!bulkTemplate) return { subject: '', htmlBody: '' }

    return prepareEmailFromTemplate(bulkTemplate, rowData)
  }

  const handleBulkSend = async () => {
    if (!bulkTemplate) {
      alert('Please select a template')
      return
    }

    let dataToSend = []
    let emailCount = 0

    if (bulkInputMode === 'file') {
      if (fileData.length === 0) {
        alert('Please upload a file with data')
        return
      }

      if (fileErrors.length > 0) {
        alert('Please fix file validation errors before sending')
        return
      }

      dataToSend = fileData
      emailCount = fileData.length
    } else {
      // Manual mode
      if (manualEntries.length === 0) {
        alert('Please add at least one recipient')
        return
      }

      const validationErrors = validateManualEntries()
      if (validationErrors.length > 0) {
        alert(`Please fix the following errors:\n\n${validationErrors.join('\n')}`)
        return
      }

      dataToSend = manualEntries
      emailCount = manualEntries.length
    }

    const confirmSend = window.confirm(`You are about to send ${emailCount} emails. Continue?`)
    if (!confirmSend) return

    setSending(true)
    try {
      // Prepare bulk email data
      const bulkEmailData = prepareBulkEmailData(dataToSend, bulkTemplate, replaceParameters)

      const result = await sendBulkEmails(bulkEmailData, {
        template: bulkTemplate,
      })
      const alertString = `Emails successfully sent:\n${JSON.stringify(
        result.success,
        null,
        2
      )}\n\nEmails failed: ${JSON.stringify(result.failures, null, 2)}`
      console.log('Bulk emails sent successfully:', result)
      alert(alertString)

      // Reset form
      setBulkTemplate(null)
      setUploadedFile(null)
      setFileData([])
      setFileErrors([])
      setManualEntries([])
    } catch (error) {
      console.error('Error sending bulk emails:', error)
      alert(`Failed to send bulk emails: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Send Email</h2>

      {!webhookConfigured && (
        <div className="alert alert-warning d-flex align-items-center" role="alert">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2"
            viewBox="0 0 16 16"
          >
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
          </svg>
          <div>
            <strong>Email webhook is not configured!</strong> You need to configure your email
            webhook in the{' '}
            <a href="/settings" className="alert-link">
              Settings
            </a>{' '}
            page before you can send emails.
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="alert alert-info">
          No templates available. Please create a template first in the Templates page.
        </div>
      ) : (
        <>
          {/* Tabs */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'single' ? 'active' : ''}`}
                onClick={() => setActiveTab('single')}
              >
                Send Single Email
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'bulk' ? 'active' : ''}`}
                onClick={() => setActiveTab('bulk')}
              >
                Bulk Send
              </button>
            </li>
          </ul>

          {/* Single Email Tab */}
          {activeTab === 'single' && (
            <div className="row">
              {/* Left Column - Template Selection and Parameters */}
              <div className="col-md-5">
                <div className="card mb-3">
                  <div className="card-header">
                    <h5 className="mb-0">1. Select Template</h5>
                  </div>
                  <div className="card-body">
                    <select
                      className="form-select"
                      value={selectedTemplate?.id || ''}
                      onChange={e => {
                        const template = templates.find(t => t.id === e.target.value)
                        handleTemplateSelect(template || null)
                      }}
                    >
                      <option value="">-- Select a template --</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedTemplate &&
                  selectedTemplate.parameters &&
                  selectedTemplate.parameters.length > 0 && (
                    <div className="card mb-3">
                      <div className="card-header">
                        <h5 className="mb-0">2. Fill Parameters</h5>
                      </div>
                      <div className="card-body">
                        {selectedTemplate.parameters.map(param => (
                          <div key={param} className="mb-3">
                            <label className="form-label">{param}</label>
                            <input
                              type="text"
                              className="form-control"
                              value={parameterValues[param] || ''}
                              onChange={e => handleParameterChange(param, e.target.value)}
                              placeholder={`Enter value for ${param}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {selectedTemplate && (
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">3. Email Details</h5>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label">
                          Subject <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={subject}
                          onChange={e => setSubject(e.target.value)}
                          placeholder="Enter email subject"
                        />
                        <div className="form-text">You can edit the subject before sending</div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">
                          Recipients <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className={`form-control ${recipientsError ? 'is-invalid' : ''}`}
                          rows="2"
                          value={recipients}
                          onChange={e => handleRecipientsChange(e.target.value)}
                          placeholder="Enter email addresses separated by commas (e.g., user1@example.com, user2@example.com)"
                        />
                        {recipientsError ? (
                          <div className="invalid-feedback">{recipientsError}</div>
                        ) : (
                          <div className="form-text">
                            Separate multiple email addresses with commas or semicolons
                          </div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label className="form-label">CC List (Optional)</label>
                        <textarea
                          className={`form-control ${ccListError ? 'is-invalid' : ''}`}
                          rows="2"
                          value={ccList}
                          onChange={e => handleCcListChange(e.target.value)}
                          placeholder="Enter CC email addresses separated by commas"
                        />
                        {ccListError ? (
                          <div className="invalid-feedback">{ccListError}</div>
                        ) : (
                          <div className="form-text">
                            Separate multiple email addresses with commas or semicolons
                          </div>
                        )}
                      </div>

                      <button
                        className="btn btn-primary w-100"
                        onClick={handleSendEmail}
                        disabled={
                          sending ||
                          !recipients.trim() ||
                          !subject.trim() ||
                          !!recipientsError ||
                          !!ccListError
                        }
                      >
                        {sending ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Sending...
                          </>
                        ) : (
                          'Send Email'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Preview */}
              <div className="col-md-7">
                {selectedTemplate ? (
                  <div className="card sticky-top" style={{ top: '20px' }}>
                    <div className="card-header">
                      <h5 className="mb-0">Email Preview</h5>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Subject:</label>
                        <div className="p-2 bg-light rounded border">
                          {subject || <span className="text-muted">No subject</span>}
                        </div>
                      </div>

                      <div>
                        <label className="form-label fw-bold">HTML Preview:</label>
                        <div
                          className="border rounded p-3 bg-white"
                          style={{
                            minHeight: '300px',
                            maxHeight: '500px',
                            overflow: 'auto',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                          }}
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlBody) }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-secondary">Select a template to see the preview</div>
                )}
              </div>
            </div>
          )}

          {/* Bulk Send Tab */}
          {activeTab === 'bulk' && (
            <div>
              <div className="row mb-3">
                {/* Select Template */}
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-header">
                      <h5 className="mb-0">1. Select Template</h5>
                    </div>
                    <div className="card-body">
                      <select
                        className="form-select"
                        value={bulkTemplate?.id || ''}
                        onChange={e => {
                          const template = templates.find(t => t.id === e.target.value)
                          handleBulkTemplateSelect(template || null)
                        }}
                      >
                        <option value="">-- Select a template --</option>
                        {templates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Choose Input Method */}
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-header">
                      <h5 className="mb-0">2. Choose Input Method</h5>
                    </div>
                    <div className="card-body">
                      <div className="btn-group w-100" role="group">
                        <input
                          type="radio"
                          className="btn-check"
                          name="bulkInputMode"
                          id="fileMode"
                          autoComplete="off"
                          checked={bulkInputMode === 'file'}
                          onChange={() => setBulkInputMode('file')}
                          disabled={!bulkTemplate}
                        />
                        <label
                          className={`btn btn-outline-primary ${!bulkTemplate ? 'disabled' : ''}`}
                          htmlFor="fileMode"
                        >
                          Upload File (CSV/Excel)
                        </label>

                        <input
                          type="radio"
                          className="btn-check"
                          name="bulkInputMode"
                          id="manualMode"
                          autoComplete="off"
                          checked={bulkInputMode === 'manual'}
                          onChange={() => setBulkInputMode('manual')}
                          disabled={!bulkTemplate}
                        />
                        <label
                          className={`btn btn-outline-primary ${!bulkTemplate ? 'disabled' : ''}`}
                          htmlFor="manualMode"
                        >
                          Enter Manually
                        </label>
                      </div>
                      {!bulkTemplate && (
                        <small className="text-muted d-block mt-2">
                          Please select a template first
                        </small>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {bulkTemplate && bulkInputMode === 'file' && (
                <div className="card mb-3">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">3. Upload File (CSV or Excel)</h5>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={handleDownloadSampleCSV}
                      title="Download sample CSV file"
                    >
                      Download Sample CSV
                    </button>
                  </div>
                  <div className="card-body">
                    <input
                      type="file"
                      className="form-control"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                    />
                    {uploadedFile && (
                      <div className="mt-2 text-muted small">
                        File: {uploadedFile.name} ({fileData.length} records)
                      </div>
                    )}
                    <div className="mt-3">
                      <small className="text-muted">
                        <strong>Accepted formats:</strong> CSV (.csv), Excel (.xlsx, .xls)
                        <br />
                        <strong>Required columns:</strong> recipient, cc
                        {bulkTemplate.parameters && bulkTemplate.parameters.length > 0 && (
                          <>, {bulkTemplate.parameters.join(', ')}</>
                        )}
                        <br />
                        <em>
                          Note: recipient and cc columns can have multiple emails separated by
                          commas or semicolons
                        </em>
                      </small>
                    </div>
                  </div>
                </div>
              )}

              {bulkTemplate && bulkInputMode === 'manual' && (
                <div className="card mb-3">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      3. Enter Recipients Manually
                      {manualEntries.length > 0 && (
                        <span className="text-muted ms-2">
                          ({manualEntries.length} recipient
                          {manualEntries.length !== 1 ? 's' : ''})
                        </span>
                      )}
                    </h5>
                    <div>
                      {manualEntries.length > 0 && (
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={handleBulkSend}
                          disabled={sending}
                        >
                          {sending ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Sending...
                            </>
                          ) : (
                            `Send ${manualEntries.length} Email${manualEntries.length !== 1 ? 's' : ''}`
                          )}
                        </button>
                      )}
                      <button className="btn btn-sm btn-primary" onClick={handleAddManualEntry}>
                        + Add Recipient
                      </button>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    {manualEntries.length === 0 ? (
                      <div className="text-muted text-center py-4">
                        No recipients added. Click "Add Recipient" to start.
                      </div>
                    ) : (
                      <div
                        className="table-responsive"
                        style={{
                          maxHeight: '500px',
                          overflow: 'auto',
                        }}
                      >
                        <table className="table table-sm table-hover mb-0">
                          <thead className="table-light sticky-top">
                            <tr>
                              <th style={{ width: '40px' }}>#</th>
                              <th style={{ minWidth: '200px' }}>
                                Recipient <span className="text-danger">*</span>
                              </th>
                              <th style={{ minWidth: '180px' }}>CC</th>
                              {bulkTemplate?.parameters?.map(param => (
                                <th key={param} style={{ minWidth: '150px' }}>
                                  {param} <span className="text-danger">*</span>
                                </th>
                              ))}
                              <th style={{ width: '140px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {manualEntries.map((entry, index) => (
                              <tr key={index}>
                                <td className="align-middle">{index + 1}</td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={entry.recipient}
                                    onChange={e =>
                                      handleManualEntryChange(index, 'recipient', e.target.value)
                                    }
                                    placeholder="user@example.com"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={entry.cc}
                                    onChange={e =>
                                      handleManualEntryChange(index, 'cc', e.target.value)
                                    }
                                    placeholder="cc@example.com"
                                  />
                                </td>
                                {bulkTemplate?.parameters?.map(param => (
                                  <td key={param}>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={entry[param] || ''}
                                      onChange={e =>
                                        handleManualEntryChange(index, param, e.target.value)
                                      }
                                      placeholder={`Enter ${param}`}
                                    />
                                  </td>
                                ))}
                                <td className="align-middle">
                                  <button
                                    className="btn btn-sm btn-outline-primary me-1"
                                    onClick={() => setPreviewIndex(index)}
                                    title="Preview"
                                  >
                                    Preview
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleRemoveManualEntry(index)}
                                    title="Remove"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {fileErrors.length > 0 && bulkInputMode === 'file' && (
                <div className="alert alert-danger">
                  <h6 className="alert-heading">File Validation Errors ({fileErrors.length})</h6>
                  <ul className="mb-0" style={{ maxHeight: '200px', overflow: 'auto' }}>
                    {fileErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {bulkInputMode === 'file' && fileData.length > 0 && fileErrors.length === 0 && (
                <div className="card mb-3">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">4. Review Data ({fileData.length} records)</h5>
                    <button className="btn btn-success" onClick={handleBulkSend} disabled={sending}>
                      {sending ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Sending...
                        </>
                      ) : (
                        `Send ${fileData.length} Emails`
                      )}
                    </button>
                  </div>
                  <div className="card-body p-0">
                    <div
                      className="table-responsive"
                      style={{
                        maxHeight: '500px',
                        overflow: 'auto',
                        padding: '0px 5px',
                      }}
                    >
                      <table className="table table-sm table-hover mb-0">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th style={{ width: '50px' }}>#</th>
                            <th>Recipient</th>
                            <th>CC</th>
                            {bulkTemplate?.parameters?.map(param => (
                              <th key={param}>{param}</th>
                            ))}
                            <th style={{ width: '100px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fileData.map((row, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{row.recipient}</td>
                              <td>{row.cc || '-'}</td>
                              {bulkTemplate?.parameters?.map(param => (
                                <td key={param}>{row[param]}</td>
                              ))}
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => setPreviewIndex(index)}
                                >
                                  Preview
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Modal */}
              {previewIndex !== null &&
                ((bulkInputMode === 'file' && fileData[previewIndex]) ||
                  (bulkInputMode === 'manual' && manualEntries[previewIndex])) && (
                  <div
                    className="modal show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                  >
                    <div className="modal-dialog modal-lg">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">
                            Email Preview - Record #{previewIndex + 1}
                          </h5>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => setPreviewIndex(null)}
                          ></button>
                        </div>
                        <div className="modal-body">
                          {(() => {
                            const data =
                              bulkInputMode === 'file'
                                ? fileData[previewIndex]
                                : manualEntries[previewIndex]
                            const previewData = getPreviewData(data)

                            return (
                              <>
                                <div className="mb-3">
                                  <label className="form-label fw-bold">Recipient:</label>
                                  <div className="p-2 bg-light rounded border">
                                    {data.recipient}
                                  </div>
                                </div>

                                {data.cc && (
                                  <div className="mb-3">
                                    <label className="form-label fw-bold">CC:</label>
                                    <div className="p-2 bg-light rounded border">{data.cc}</div>
                                  </div>
                                )}

                                <div className="mb-3">
                                  <label className="form-label fw-bold">Subject:</label>
                                  <div className="p-2 bg-light rounded border">
                                    {previewData.subject || (
                                      <span className="text-muted">No subject</span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <label className="form-label fw-bold">HTML Preview:</label>
                                  <div
                                    className="border rounded p-3 bg-white"
                                    style={{
                                      minHeight: '300px',
                                      maxHeight: '400px',
                                      overflow: 'auto',
                                      wordBreak: 'break-word',
                                      whiteSpace: 'pre-wrap',
                                    }}
                                    dangerouslySetInnerHTML={{
                                      __html: sanitizeHtml(previewData.htmlBody),
                                    }}
                                  />
                                </div>
                              </>
                            )
                          })()}
                        </div>
                        <div className="modal-footer">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setPreviewIndex(null)}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SendEmail
