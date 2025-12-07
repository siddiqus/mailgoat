import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageCard from '../components/PageCard'
import PageContainer from '../components/PageContainer'
import SearchableSelect from '../components/SearchableSelect'
import Tabs from '../components/ui/Tabs'
import { useAlert } from '../contexts/AlertContext'
import LocalStorageSettingsRepository from '../repositories/LocalStorageSettingsRepository'
import { getAllCampaigns } from '../services/campaignService'
import { saveToHistory } from '../services/emailHistoryService'
import {
  prepareBulkEmailData,
  sendBulkEmailsAsync,
  sendSingleEmail,
} from '../services/emailService'
import { parseFile, validateDataRows } from '../services/fileParsingService'
import { getAllTemplates } from '../services/templateRepositoryService'
import {
  downloadCSV,
  generateSampleCSV,
  prepareEmailFromTemplate,
} from '../services/templateService'
import { parseEmailList, validateEmailList } from '../utils/emailUtils'
import { sanitizeHtml } from '../utils/sanitizer'

const settingsRepository = new LocalStorageSettingsRepository()

function SendEmail() {
  const navigate = useNavigate()
  const { showAlert, showConfirm } = useAlert()
  const [templates, setTemplates] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedCampaign, setSelectedCampaign] = useState(null)

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

  // Load templates, campaigns, and settings on mount
  useEffect(() => {
    loadTemplates()
    loadCampaigns()
    loadSettings()
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

  const loadCampaigns = async () => {
    try {
      const data = await getAllCampaigns()
      setCampaigns(data)
    } catch (error) {
      console.error('Error loading campaigns:', error)
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
      setSubject(newSubject)
      setHtmlBody(newHtmlBody)
    } else {
      setSubject('')
      setHtmlBody('')
    }
  }, [selectedTemplate, parameterValues])

  const handleTemplateSelect = template => {
    setSelectedTemplate(template)
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
      // Check if multiple emails are entered
      const emailList = parseEmailList(value)
      if (emailList.length > 1) {
        setRecipientsError('Only one recipient email is allowed for single email')
      } else {
        const validation = validateEmailList(value)
        if (!validation.isValid) {
          setRecipientsError(`Invalid email: ${validation.invalidEmails.join(', ')}`)
        } else {
          setRecipientsError('')
        }
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
    if (!recipients.trim()) {
      showAlert({
        title: 'Validation Error',
        message: 'Please enter a recipient email address',
        type: 'warning',
      })
      return
    }

    // Check if multiple emails are entered
    const emailList = parseEmailList(recipients)
    if (emailList.length > 1) {
      showAlert({
        title: 'Validation Error',
        message: 'Only one recipient email is allowed for single email',
        type: 'warning',
      })
      return
    }

    const recipientsValidation = validateEmailList(recipients)
    if (!recipientsValidation.isValid) {
      showAlert({
        title: 'Validation Error',
        message: `Invalid recipient email: ${recipientsValidation.invalidEmails.join(', ')}`,
        type: 'warning',
      })
      return
    }

    if (ccList.trim()) {
      const ccValidation = validateEmailList(ccList)
      if (!ccValidation.isValid) {
        showAlert({
          title: 'Validation Error',
          message: `Invalid CC email(s): ${ccValidation.invalidEmails.join(', ')}`,
          type: 'warning',
        })
        return
      }
    }

    if (!subject.trim()) {
      showAlert({
        title: 'Validation Error',
        message: 'Please enter a subject',
        type: 'warning',
      })
      return
    }

    if (!htmlBody.trim()) {
      showAlert({
        title: 'Validation Error',
        message: 'Email body cannot be empty',
        type: 'warning',
      })
      return
    }

    const hasUnfilledParams = selectedTemplate?.parameters?.some(
      param => !parameterValues[param] || parameterValues[param].trim() === ''
    )
    if (hasUnfilledParams) {
      const confirmed = await showConfirm({
        title: 'Unfilled Parameters',
        message: 'Some parameters are not filled. Do you want to continue?',
        type: 'warning',
        confirmText: 'Continue',
        cancelText: 'Cancel',
      })
      if (!confirmed) return
    }

    setSending(true)
    try {
      const recipientList = parseEmailList(recipients)
      const ccListArray = parseEmailList(ccList)

      const emailData = {
        recipients: recipientList,
        ccList: ccListArray,
        subject,
        htmlBody,
        campaignId: selectedCampaign,
      }

      try {
        const sentEmail = await sendSingleEmail(emailData, {
          template: selectedTemplate,
          campaignId: selectedCampaign,
        })

        try {
          await saveToHistory(sentEmail, selectedTemplate)
        } catch (historyError) {
          console.error('Failed to save email to history:', historyError)
        }

        showAlert({
          title: 'Success',
          message: 'Email sent successfully!',
          type: 'success',
        })

        setSelectedTemplate(null)
        setSelectedCampaign(null)
        setParameterValues({})
        setRecipients('')
        setCcList('')
        setRecipientsError('')
        setCcListError('')
      } catch (error) {
        showAlert({
          title: 'Error',
          message: `Error sending email: ${error.message}`,
          type: 'danger',
        })
      }
    } catch (error) {
      console.error('Error sending email:', error)
      showAlert({
        title: 'Error',
        message: `Failed to send email: ${error.message}`,
        type: 'danger',
      })
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
      if (!entry.recipient || !entry.recipient.trim()) {
        errors.push(`Row ${index + 1}: Recipient is required`)
      } else {
        // Check if multiple emails are entered
        const emailList = parseEmailList(entry.recipient)
        if (emailList.length > 1) {
          errors.push(`Row ${index + 1}: Only one recipient email is allowed per row`)
        } else {
          const recipientValidation = validateEmailList(entry.recipient)
          if (!recipientValidation.isValid) {
            errors.push(
              `Row ${index + 1}: Invalid recipient email: ${recipientValidation.invalidEmails.join(', ')}`
            )
          }
        }
      }

      if (entry.cc && entry.cc.trim()) {
        const ccValidation = validateEmailList(entry.cc)
        if (!ccValidation.isValid) {
          errors.push(
            `Row ${index + 1}: Invalid CC email(s): ${ccValidation.invalidEmails.join(', ')}`
          )
        }
      }

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

    setUploadedFile(null)
    setFileData([])
    setFileErrors([])
    setPreviewIndex(null)

    try {
      const data = await parseFile(file)
      const errors = validateDataRows(data, bulkTemplate?.parameters)

      setUploadedFile(file)
      setFileData(data)
      setFileErrors(errors)

      if (errors.length > 0) {
        showAlert({
          title: 'Validation Failed',
          message: `File validation failed with ${errors.length} error(s). Please check the errors below.`,
          type: 'warning',
        })
      }
    } catch (error) {
      showAlert({
        title: 'Error',
        message: `Error parsing file: ${error.message}`,
        type: 'danger',
      })
      event.target.value = ''
    }
  }

  const getPreviewData = rowData => {
    if (!bulkTemplate) return { subject: '', htmlBody: '' }

    return prepareEmailFromTemplate(bulkTemplate, rowData)
  }

  // Build template options for searchable select
  const templateOptions = useMemo(() => {
    const options = [{ value: '', label: '-- Select a template --' }]
    templates.forEach(template => {
      options.push({
        value: template.id,
        label: template.name,
      })
    })
    return options
  }, [templates])

  // Build campaign options for searchable select
  const campaignOptions = useMemo(() => {
    const options = [{ value: '', label: '-- No campaign --' }]
    campaigns.forEach(campaign => {
      options.push({
        value: campaign.id,
        label: campaign.name,
      })
    })
    return options
  }, [campaigns])

  const handleBulkSend = async () => {
    if (!bulkTemplate) {
      showAlert({
        title: 'Validation Error',
        message: 'Please select a template',
        type: 'warning',
      })
      return
    }

    let dataToSend = []
    let emailCount = 0

    if (bulkInputMode === 'file') {
      if (fileData.length === 0) {
        showAlert({
          title: 'Validation Error',
          message: 'Please upload a file with data',
          type: 'warning',
        })
        return
      }

      if (fileErrors.length > 0) {
        showAlert({
          title: 'Validation Error',
          message: 'Please fix file validation errors before sending',
          type: 'warning',
        })
        return
      }

      dataToSend = fileData
      emailCount = fileData.length
    } else {
      if (manualEntries.length === 0) {
        showAlert({
          title: 'Validation Error',
          message: 'Please add at least one recipient',
          type: 'warning',
        })
        return
      }

      const validationErrors = validateManualEntries()
      if (validationErrors.length > 0) {
        showAlert({
          title: 'Validation Errors',
          message: `Please fix the following errors:\n\n${validationErrors.join('\n')}`,
          type: 'warning',
        })
        return
      }

      dataToSend = manualEntries
      emailCount = manualEntries.length
    }

    const confirmed = await showConfirm({
      title: 'Confirm Bulk Send',
      message: `You are about to send ${emailCount} emails. The emails will be sent in the background. Continue?`,
      type: 'warning',
      confirmText: 'Send Emails',
      cancelText: 'Cancel',
    })
    if (!confirmed) return

    setSending(true)
    try {
      const bulkEmailData = prepareBulkEmailData(dataToSend, bulkTemplate)

      await sendBulkEmailsAsync(bulkEmailData, {
        template: bulkTemplate,
        campaignId: selectedCampaign,
      })

      console.log(
        `Started sending ${emailCount} emails in the background. Redirecting to History page...`
      )

      const queryParams = new URLSearchParams()
      if (bulkTemplate?.id) {
        queryParams.set('template', bulkTemplate.id)
      }
      if (selectedCampaign) {
        queryParams.set('campaign', selectedCampaign)
      }

      navigate(`/history?${queryParams.toString()}`)
    } catch (error) {
      console.error('Error initiating bulk email send:', error)
      showAlert({
        title: 'Error',
        message: `Failed to initiate bulk email send: ${error.message}`,
        type: 'danger',
      })
      setSending(false)
    }
  }

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
      <h2 className="mb-4">Send Email</h2>

      {!webhookConfigured && (
        <div className="alert alert-warning d-flex align-items-center mb-4" role="alert">
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
        <Tabs defaultTab="single">
          <Tabs.Tab value="single" label="Send Single Email">
            <div className="row">
              {/* Left Column - Configuration */}
              <div className="col-md-5">
                <PageCard header="1. Template & Campaign" className="mb-3">
                  <div className="mb-3">
                    <SearchableSelect
                      label="Template"
                      options={templateOptions}
                      value={selectedTemplate?.id || ''}
                      onChange={value => {
                        const template = templates.find(t => t.id === value)
                        handleTemplateSelect(template || null)
                      }}
                      placeholder="-- Select a template --"
                      allowClear={false}
                    />
                  </div>
                  <div>
                    <SearchableSelect
                      label="Campaign (Optional)"
                      options={campaignOptions}
                      value={selectedCampaign || ''}
                      onChange={value => setSelectedCampaign(value || null)}
                      placeholder="-- No campaign --"
                      allowClear={false}
                    />
                    <div className="form-text mt-2">
                      Associate this email with a campaign for tracking
                    </div>
                  </div>
                </PageCard>

                {selectedTemplate &&
                  selectedTemplate.parameters &&
                  selectedTemplate.parameters.length > 0 && (
                    <PageCard header="2. Fill Parameters" className="mb-3">
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
                    </PageCard>
                  )}

                {selectedTemplate && (
                  <PageCard header="3. Email Details">
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
                        Recipient <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className={`form-control ${recipientsError ? 'is-invalid' : ''}`}
                        value={recipients}
                        onChange={e => handleRecipientsChange(e.target.value)}
                        placeholder="user@example.com"
                      />
                      {recipientsError ? (
                        <div className="invalid-feedback">{recipientsError}</div>
                      ) : (
                        <div className="form-text">Enter a single recipient email address</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">CC List (Optional)</label>
                      <textarea
                        className={`form-control ${ccListError ? 'is-invalid' : ''}`}
                        rows="2"
                        value={ccList}
                        onChange={e => handleCcListChange(e.target.value)}
                        placeholder="cc1@example.com, cc2@example.com"
                      />
                      {ccListError ? (
                        <div className="invalid-feedback">{ccListError}</div>
                      ) : (
                        <div className="form-text">Separate multiple emails with commas</div>
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
                  </PageCard>
                )}
              </div>

              {/* Right Column - Preview */}
              <div className="col-md-7">
                {selectedTemplate ? (
                  <PageCard header="Email Preview" className="sticky-top" style={{ top: '20px' }}>
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
                  </PageCard>
                ) : (
                  <div className="alert alert-secondary">Select a template to see the preview</div>
                )}
              </div>
            </div>
          </Tabs.Tab>

          <Tabs.Tab value="bulk" label="Bulk Send">
            <div className="row mb-3">
              <div className="col-md-4">
                <PageCard header="1. Select Template">
                  <SearchableSelect
                    options={templateOptions}
                    value={bulkTemplate?.id || ''}
                    onChange={value => {
                      const template = templates.find(t => t.id === value)
                      handleBulkTemplateSelect(template || null)
                    }}
                    placeholder="-- Select a template --"
                    allowClear={false}
                  />
                  <div className="form-text mt-2">Select a template to start</div>
                </PageCard>
              </div>

              <div className="col-md-4">
                <PageCard header="2. Select Campaign">
                  <SearchableSelect
                    options={campaignOptions}
                    value={selectedCampaign || ''}
                    onChange={value => setSelectedCampaign(value || null)}
                    placeholder="-- No campaign --"
                    allowClear={false}
                  />
                  <div className="form-text mt-2">Optional: Track bulk emails</div>
                </PageCard>
              </div>

              <div className="col-md-4">
                <PageCard header="3. Input Method">
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
                      Upload File
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
                      Manual Entry
                    </label>
                  </div>
                  {!bulkTemplate && (
                    <small className="text-muted d-block mt-2">
                      Please select a template first
                    </small>
                  )}
                </PageCard>
              </div>
            </div>

            {bulkTemplate && bulkInputMode === 'file' && (
              <PageCard
                header="4. Upload File"
                className="mb-3"
                headerActions={
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleDownloadSampleCSV}
                    title="Download sample CSV file"
                  >
                    Download Sample
                  </button>
                }
              >
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
                <div className="mt-3 small text-muted">
                  <strong>Accepted formats:</strong> CSV (.csv), Excel (.xlsx, .xls)
                  <br />
                  <strong>Required columns:</strong> recipient
                  {bulkTemplate.parameters && bulkTemplate.parameters.length > 0 && (
                    <>, {bulkTemplate.parameters.join(', ')}</>
                  )}
                  <br />
                  <strong>Optional columns:</strong> cc
                </div>
              </PageCard>
            )}

            {bulkTemplate && bulkInputMode === 'manual' && (
              <PageCard
                header={
                  <span>
                    4. Enter Recipients
                    {manualEntries.length > 0 && (
                      <span className="text-muted ms-2">
                        ({manualEntries.length} recipient{manualEntries.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </span>
                }
                className="mb-3"
                headerActions={
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
                }
              >
                {manualEntries.length === 0 ? (
                  <div className="text-muted text-center py-4">
                    No recipients added. Click "Add Recipient" to start.
                  </div>
                ) : (
                  <div
                    className="table-responsive"
                    style={{ maxHeight: '500px', overflow: 'auto' }}
                  >
                    <table className="table table-sm table-hover mb-0">
                      <thead className="sticky-top">
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
                                onChange={e => handleManualEntryChange(index, 'cc', e.target.value)}
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
              </PageCard>
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
              <PageCard
                header={`5. Review Data (${fileData.length} records)`}
                className="mb-3"
                headerActions={
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
                }
              >
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
              </PageCard>
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
                        <h5 className="modal-title">Email Preview - Record #{previewIndex + 1}</h5>
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
                                <div className="p-2 bg-light rounded border">{data.recipient}</div>
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
          </Tabs.Tab>
        </Tabs>
      )}
    </PageContainer>
  )
}

export default SendEmail
