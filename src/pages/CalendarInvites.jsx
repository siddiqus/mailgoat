import { useEffect, useState, useMemo } from 'react'
import PageCard from '../components/PageCard'
import PageContainer from '../components/PageContainer'
import SearchableSelect from '../components/SearchableSelect'
import { useAlert } from '../contexts/AlertContext'
import LocalStorageSettingsRepository from '../repositories/LocalStorageSettingsRepository'
import { saveCalendarInviteToHistory } from '../services/calendarInviteHistoryService'
import { sendCalendarInvite } from '../services/calendarInviteService'
import { getAllTemplates } from '../services/templateRepositoryService'
import { prepareEmailFromTemplate } from '../services/templateService'
import { parseEmailList, validateEmailList } from '../utils/emailUtils'
import { sanitizeHtml } from '../utils/sanitizer'
import { calculateEndTime } from '../utils/timeUtils'
import timezones from '../utils/timezones.json'

const settingsRepository = new LocalStorageSettingsRepository()

function CalendarInvites() {
  const { showAlert, showConfirm } = useAlert()
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  // Calendar-specific fields
  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState('')
  const [startTime, setStartTime] = useState('')
  const [timezone, setTimezone] = useState('Eastern Standard Time')
  const [durationInMinutes, setDurationInMinutes] = useState('60')
  const [parameterValues, setParameterValues] = useState({})

  // Attachment fields
  const [attachmentFile, setAttachmentFile] = useState(null)
  const [attachmentBase64, setAttachmentBase64] = useState('')

  // Preview and validation
  const [htmlBody, setHtmlBody] = useState('')
  const [recipientError, setRecipientError] = useState('')
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
      // Filter only calendar templates
      const calendarTemplates = data.filter(t => t.type === 'calendar')
      setTemplates(calendarTemplates)
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

  const loadSettings = async () => {
    try {
      const settings = await settingsRepository.getSettings()
      const isConfigured =
        settings.calendarWebhook?.url && settings.calendarWebhook.url.trim() !== ''
      setWebhookConfigured(isConfigured)
    } catch (error) {
      console.error('Error loading settings:', error)
      setWebhookConfigured(false)
    }
  }

  // Calculate end time from start time and duration using utility function
  const endTime = calculateEndTime(startTime, durationInMinutes)

  // Update preview when template or parameters change
  useEffect(() => {
    if (selectedTemplate) {
      const allParams = {
        ...parameterValues,
        startTime,
        timezone,
        durationInMinutes,
      }
      const { subject: newSubject, htmlBody: newHtmlBody } = prepareEmailFromTemplate(
        selectedTemplate,
        allParams
      )
      setSubject(newSubject)
      setHtmlBody(newHtmlBody)
    } else {
      setSubject('')
      setHtmlBody('')
    }
  }, [selectedTemplate, parameterValues, startTime, timezone, durationInMinutes])

  const handleTemplateSelect = template => {
    setSelectedTemplate(template)
    const initialValues = {}
    if (template.parameters) {
      template.parameters.forEach(param => {
        // Skip predefined calendar parameters
        if (!['startTime', 'timezone', 'durationInMinutes'].includes(param)) {
          initialValues[param] = ''
        }
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

  const handleRecipientChange = value => {
    setRecipient(value)

    if (value.trim()) {
      const emailList = parseEmailList(value)
      if (emailList.length > 1) {
        setRecipientError('Only one recipient email is allowed')
      } else {
        const validation = validateEmailList(value)
        if (!validation.isValid) {
          setRecipientError(`Invalid email: ${validation.invalidEmails.join(', ')}`)
        } else {
          setRecipientError('')
        }
      }
    } else {
      setRecipientError('')
    }
  }

  const handleFileChange = async e => {
    const file = e.target.files[0]
    if (!file) {
      setAttachmentFile(null)
      setAttachmentBase64('')
      return
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      showAlert({
        title: 'Invalid File Type',
        message: 'Only PDF files are allowed',
        type: 'warning',
      })
      e.target.value = ''
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showAlert({
        title: 'File Too Large',
        message: 'File size must be less than 5MB',
        type: 'warning',
      })
      e.target.value = ''
      return
    }

    setAttachmentFile(file)

    // Convert to base64
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      setAttachmentBase64(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleSendInvite = async () => {
    // Validate recipient
    if (!recipient.trim()) {
      showAlert({
        title: 'Validation Error',
        message: 'Please enter a recipient email address',
        type: 'warning',
      })
      return
    }

    const emailList = parseEmailList(recipient)
    if (emailList.length > 1) {
      showAlert({
        title: 'Validation Error',
        message: 'Only one recipient email is allowed',
        type: 'warning',
      })
      return
    }

    const recipientValidation = validateEmailList(recipient)
    if (!recipientValidation.isValid) {
      showAlert({
        title: 'Validation Error',
        message: `Invalid recipient email: ${recipientValidation.invalidEmails.join(', ')}`,
        type: 'warning',
      })
      return
    }

    // Validate required fields
    if (!subject.trim()) {
      showAlert({
        title: 'Validation Error',
        message: 'Please enter a subject',
        type: 'warning',
      })
      return
    }

    if (!startTime) {
      showAlert({
        title: 'Validation Error',
        message: 'Please select a start time',
        type: 'warning',
      })
      return
    }

    if (!durationInMinutes || parseInt(durationInMinutes, 10) <= 0) {
      showAlert({
        title: 'Validation Error',
        message: 'Please enter a valid duration',
        type: 'warning',
      })
      return
    }

    // Check for unfilled parameters
    const otherParams = Object.keys(parameterValues)
    const hasUnfilledParams = otherParams.some(
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
      const settings = await settingsRepository.getSettings()

      // Prepare the calendar invite body
      const calendarInviteBody = {
        subject,
        to: recipient.trim(),
        message: htmlBody,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        timezone,
      }

      // Add attachment if present
      if (attachmentFile && attachmentBase64) {
        calendarInviteBody.attachment = {
          name: attachmentFile.name,
          fileBase64: attachmentBase64,
        }
      }

      await sendCalendarInvite(settings, calendarInviteBody)

      // Save to history
      try {
        await saveCalendarInviteToHistory(
          {
            recipient: recipient.trim(),
            subject,
            message: htmlBody,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            timezone,
            attachmentName: attachmentFile?.name,
          },
          selectedTemplate
        )
      } catch (historyError) {
        console.error('Failed to save calendar invite to history:', historyError)
      }

      showAlert({
        title: 'Success',
        message: 'Calendar invite sent successfully!',
        type: 'success',
      })

      // Reset form
      setSelectedTemplate(null)
      setRecipient('')
      setSubject('')
      setStartTime('')
      setTimezone('Eastern Standard Time')
      setDurationInMinutes('60')
      setParameterValues({})
      setAttachmentFile(null)
      setAttachmentBase64('')
      setRecipientError('')
    } catch (error) {
      console.error('Error sending calendar invite:', error)
      showAlert({
        title: 'Error',
        message: `Failed to send calendar invite: ${error.message}`,
        type: 'danger',
      })
    } finally {
      setSending(false)
    }
  }

  // Build template options for searchable select
  const templateOptions = useMemo(() => {
    const options = [{ value: '', label: '-- Select a calendar template --' }]
    templates.forEach(template => {
      options.push({
        value: template.id,
        label: template.name,
      })
    })
    return options
  }, [templates])

  // Build timezone options - sorted alphabetically and deduplicated
  const timezoneOptions = useMemo(() => {
    // Use a Map to deduplicate by value (windowsTime)
    const uniqueMap = new Map()

    timezones.forEach(tz => {
      // Only add if we haven't seen this windowsTime before
      if (!uniqueMap.has(tz.windowsTime)) {
        uniqueMap.set(tz.windowsTime, {
          value: tz.windowsTime,
          label: `${tz.windowsTime} (${tz.city})`,
        })
      }
    })

    // Convert Map values to array and sort alphabetically
    return Array.from(uniqueMap.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [])

  // Get non-predefined parameters
  const otherParameters = useMemo(() => {
    if (!selectedTemplate?.parameters) return []
    return selectedTemplate.parameters.filter(
      param => !['startTime', 'timezone', 'durationInMinutes'].includes(param)
    )
  }, [selectedTemplate])

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
      <h2 className="mb-4">Send Calendar Invite</h2>

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
            <strong>Calendar webhook is not configured!</strong> You need to configure your calendar
            webhook in the{' '}
            <a href="/settings" className="alert-link">
              Settings
            </a>{' '}
            page before you can send calendar invites.
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="alert alert-info">
          No calendar templates available. Please create a calendar template first in the Templates
          page.
        </div>
      ) : (
        <div className="row">
          {/* Left Column - Configuration */}
          <div className="col-md-5">
            <PageCard header="1. Select Template" className="mb-3">
              <SearchableSelect
                options={templateOptions}
                value={selectedTemplate?.id || ''}
                onChange={value => {
                  const template = templates.find(t => t.id === value)
                  handleTemplateSelect(template || null)
                }}
                placeholder="-- Select a calendar template --"
                allowClear={false}
              />
            </PageCard>

            {selectedTemplate && (
              <>
                <PageCard header="2. Calendar Details" className="mb-3">
                  <div className="mb-3">
                    <label className="form-label">
                      Start Time <span className="text-danger">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Timezone <span className="text-danger">*</span>
                    </label>
                    <SearchableSelect
                      options={timezoneOptions}
                      value={timezone}
                      onChange={value => setTimezone(value)}
                      placeholder="Select timezone"
                      allowClear={false}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Duration (minutes) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={durationInMinutes}
                      onChange={e => setDurationInMinutes(e.target.value)}
                      min="1"
                      placeholder="60"
                    />
                  </div>

                  {endTime && (
                    <div className="alert alert-info mb-0">
                      <small>
                        <strong>End Time:</strong> {new Date(endTime).toLocaleString()}
                      </small>
                    </div>
                  )}
                </PageCard>

                {otherParameters.length > 0 && (
                  <PageCard header="3. Fill Parameters" className="mb-3">
                    {otherParameters.map(param => (
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

                <PageCard header={`${otherParameters.length > 0 ? '4' : '3'}. Invite Details`}>
                  <div className="mb-3">
                    <label className="form-label">
                      Subject <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="Enter invite subject"
                    />
                    <div className="form-text">You can edit the subject before sending</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Recipient <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className={`form-control ${recipientError ? 'is-invalid' : ''}`}
                      value={recipient}
                      onChange={e => handleRecipientChange(e.target.value)}
                      placeholder="user@example.com"
                    />
                    {recipientError ? (
                      <div className="invalid-feedback">{recipientError}</div>
                    ) : (
                      <div className="form-text">Enter a single recipient email address</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Attachment (Optional)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                    <div className="form-text">
                      PDF files only, max 5MB
                      {attachmentFile && (
                        <span className="text-success ms-2">
                          ✓ {attachmentFile.name} ({(attachmentFile.size / 1024).toFixed(0)} KB)
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary w-100"
                    onClick={handleSendInvite}
                    disabled={sending || !recipient.trim() || !subject.trim() || !!recipientError}
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
                      'Send Calendar Invite'
                    )}
                  </button>
                </PageCard>
              </>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="col-md-7">
            {selectedTemplate ? (
              <PageCard header="Invite Preview" className="sticky-top" style={{ top: '20px' }}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Subject:</label>
                  <div className="p-2 bg-light rounded border">
                    {subject || <span className="text-muted">No subject</span>}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Start Time:</label>
                  <div className="p-2 bg-light rounded border">
                    {startTime ? (
                      new Date(startTime).toLocaleString()
                    ) : (
                      <span className="text-muted">Not set</span>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">End Time:</label>
                  <div className="p-2 bg-light rounded border">
                    {endTime ? (
                      new Date(endTime).toLocaleString()
                    ) : (
                      <span className="text-muted">Not set</span>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Timezone:</label>
                  <div className="p-2 bg-light rounded border">{timezone}</div>
                </div>

                <div>
                  <label className="form-label fw-bold">Message Preview:</label>
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
              <div className="alert alert-secondary">
                Select a calendar template to see the preview
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  )
}

export default CalendarInvites
