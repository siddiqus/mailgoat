import React, { useState, useEffect } from 'react'
import { sendSingleEmail, sendBulkEmails } from '../services/emailService'
import {
  replaceParameters,
  parseEmailList,
  prepareEmailFromTemplate,
  generateSampleCSV,
  downloadCSV
} from '../services/templateService'
import { validateCSVData, parseCSVFile, prepareBulkEmailData } from '../services/csvService'
import { getAllTemplates } from '../services/templateRepositoryService'

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

  // Bulk email state
  const [bulkTemplate, setBulkTemplate] = useState(null)
  const [csvFile, setCsvFile] = useState(null)
  const [csvData, setCsvData] = useState([])
  const [csvErrors, setCsvErrors] = useState([])
  const [previewIndex, setPreviewIndex] = useState(null)

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Load templates on mount
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

  // Update preview when template or parameters change
  useEffect(() => {
    if (selectedTemplate) {
      const { subject: newSubject, htmlBody: newHtmlBody } = prepareEmailFromTemplate(
        selectedTemplate,
        parameterValues
      )
      setSubject(newSubject)
      setHtmlBody(newHtmlBody)
    } else {
      setSubject('')
      setHtmlBody('')
    }
  }, [selectedTemplate, parameterValues])

  const handleTemplateSelect = (template) => {
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
      [paramName]: value
    }))
  }

  const handleSendEmail = async () => {
    // Validate inputs
    if (!recipients.trim()) {
      alert('Please enter at least one recipient email address')
      return
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
    const hasUnfilledParams = selectedTemplate?.parameters?.some(param =>
      !parameterValues[param] || parameterValues[param].trim() === ''
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
        subject: subject,
        htmlString: htmlBody
      }

      const result = await sendSingleEmail(emailData)
      console.log('Email sent successfully:', result)
      alert('Email sent successfully!')

      // Reset form
      setSelectedTemplate(null)
      setParameterValues({})
      setRecipients('')
      setCcList('')
    } catch (error) {
      console.error('Error sending email:', error)
      alert(`Failed to send email: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  // Bulk email functions
  const handleBulkTemplateSelect = (template) => {
    setBulkTemplate(template)
    setCsvFile(null)
    setCsvData([])
    setCsvErrors([])
    setPreviewIndex(null)
  }

  const handleDownloadSampleCSV = () => {
    if (!bulkTemplate) return

    const csvContent = generateSampleCSV(bulkTemplate)
    downloadCSV(csvContent, `${bulkTemplate.name}_template.csv`)
  }

  const handleCSVUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setCsvFile(file)
    setCsvErrors([])

    try {
      const data = await parseCSVFile(file)
      const errors = validateCSVData(data, bulkTemplate?.parameters)
      setCsvData(data)
      setCsvErrors(errors)

      if (errors.length > 0) {
        alert(`CSV validation failed with ${errors.length} error(s). Please check the errors below.`)
      }
    } catch (error) {
      alert(`Error parsing CSV: ${error.message}`)
      setCsvFile(null)
    }
  }

  const getPreviewData = (rowData) => {
    if (!bulkTemplate) return { subject: '', htmlBody: '' }

    return prepareEmailFromTemplate(bulkTemplate, rowData)
  }

  const handleBulkSend = async () => {
    if (!bulkTemplate) {
      alert('Please select a template')
      return
    }

    if (csvData.length === 0) {
      alert('Please upload a CSV file with data')
      return
    }

    if (csvErrors.length > 0) {
      alert('Please fix CSV validation errors before sending')
      return
    }

    const confirmSend = window.confirm(`You are about to send ${csvData.length} emails. Continue?`)
    if (!confirmSend) return

    setSending(true)
    try {
      // Prepare bulk email data
      const bulkEmailData = prepareBulkEmailData(csvData, bulkTemplate, replaceParameters)

      const result = await sendBulkEmails(bulkEmailData)
      console.log('Bulk emails sent successfully:', result)
      alert(`Successfully sent ${csvData.length} emails!`)

      // Reset form
      setBulkTemplate(null)
      setCsvFile(null)
      setCsvData([])
      setCsvErrors([])
    } catch (error) {
      console.error('Error sending bulk emails:', error)
      alert(`Failed to send bulk emails: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Send Email</h2>

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
                  onChange={(e) => {
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

            {selectedTemplate && selectedTemplate.parameters && selectedTemplate.parameters.length > 0 && (
              <div className="card mb-3">
                <div className="card-header">
                  <h5 className="mb-0">2. Fill Parameters</h5>
                </div>
                <div className="card-body">
                  {selectedTemplate.parameters.map(param => (
                    <div key={param} className="mb-3">
                      <label className="form-label">
                        {param}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={parameterValues[param] || ''}
                        onChange={(e) => handleParameterChange(param, e.target.value)}
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
                      Recipients <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={recipients}
                      onChange={(e) => setRecipients(e.target.value)}
                      placeholder="Enter email addresses separated by commas (e.g., user1@example.com, user2@example.com)"
                    />
                    <div className="form-text">
                      Separate multiple email addresses with commas
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">CC List (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={ccList}
                      onChange={(e) => setCcList(e.target.value)}
                      placeholder="Enter CC email addresses separated by commas"
                    />
                  </div>

                  <button
                    className="btn btn-primary w-100"
                    onClick={handleSendEmail}
                    disabled={sending || !recipients.trim()}
                  >
                    {sending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                      dangerouslySetInnerHTML={{ __html: htmlBody }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-secondary">
                Select a template to see the preview
              </div>
            )}
          </div>
        </div>
          )}

          {/* Bulk Send Tab */}
          {activeTab === 'bulk' && (
            <div>
              <div className="row">
                <div className="col-12">
                  <div className="card mb-3">
                    <div className="card-header">
                      <h5 className="mb-0">1. Select Template</h5>
                    </div>
                    <div className="card-body">
                      <div className="row align-items-end">
                        <div className="col-md-8">
                          <label className="form-label">Template</label>
                          <select
                            className="form-select"
                            value={bulkTemplate?.id || ''}
                            onChange={(e) => {
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
                        <div className="col-md-4">
                          <button
                            className="btn btn-outline-primary w-100"
                            onClick={handleDownloadSampleCSV}
                            disabled={!bulkTemplate}
                          >
                            Download Sample CSV
                          </button>
                        </div>
                      </div>
                      {bulkTemplate && (
                        <div className="mt-3">
                          <small className="text-muted">
                            Required CSV columns: <strong>recipient, cc</strong>
                            {bulkTemplate.parameters && bulkTemplate.parameters.length > 0 && (
                              <>, {bulkTemplate.parameters.join(', ')}</>
                            )}
                            <br />
                            <em>Note: recipient and cc columns can have multiple emails separated by commas or semicolons</em>
                          </small>
                        </div>
                      )}
                    </div>
                  </div>

                  {bulkTemplate && (
                    <div className="card mb-3">
                      <div className="card-header">
                        <h5 className="mb-0">2. Upload CSV File</h5>
                      </div>
                      <div className="card-body">
                        <input
                          type="file"
                          className="form-control"
                          accept=".csv"
                          onChange={handleCSVUpload}
                        />
                        {csvFile && (
                          <div className="mt-2 text-muted small">
                            File: {csvFile.name} ({csvData.length} records)
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {csvErrors.length > 0 && (
                    <div className="alert alert-danger">
                      <h6 className="alert-heading">CSV Validation Errors ({csvErrors.length})</h6>
                      <ul className="mb-0" style={{ maxHeight: '200px', overflow: 'auto' }}>
                        {csvErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {csvData.length > 0 && csvErrors.length === 0 && (
                    <div className="card mb-3">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">3. Review Data ({csvData.length} records)</h5>
                        <button
                          className="btn btn-success"
                          onClick={handleBulkSend}
                          disabled={sending}
                        >
                          {sending ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Sending...
                            </>
                          ) : (
                            `Send ${csvData.length} Emails`
                          )}
                        </button>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive" style={{ maxHeight: '500px', overflow: 'auto' }}>
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
                              {csvData.map((row, index) => (
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
                </div>
              </div>

              {/* Preview Modal */}
              {previewIndex !== null && csvData[previewIndex] && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
                        <div className="mb-3">
                          <label className="form-label fw-bold">Recipient:</label>
                          <div className="p-2 bg-light rounded border">
                            {csvData[previewIndex].recipient}
                          </div>
                        </div>

                        {csvData[previewIndex].cc && (
                          <div className="mb-3">
                            <label className="form-label fw-bold">CC:</label>
                            <div className="p-2 bg-light rounded border">
                              {csvData[previewIndex].cc}
                            </div>
                          </div>
                        )}

                        <div className="mb-3">
                          <label className="form-label fw-bold">Subject:</label>
                          <div className="p-2 bg-light rounded border">
                            {getPreviewData(csvData[previewIndex]).subject || <span className="text-muted">No subject</span>}
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
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word'
                            }}
                            dangerouslySetInnerHTML={{ __html: getPreviewData(csvData[previewIndex]).htmlBody }}
                          />
                        </div>
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
