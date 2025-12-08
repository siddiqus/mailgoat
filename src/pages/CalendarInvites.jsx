import { useEffect, useState, useMemo, useCallback } from 'react'
import PageCard from '../components/PageCard'
import PageContainer from '../components/PageContainer'
import SearchableSelect from '../components/SearchableSelect'
import TimePickerInput from '../components/TimePickerInput'
import { useAlert } from '../contexts/AlertContext'
import LocalStorageSettingsRepository from '../repositories/LocalStorageSettingsRepository'
import { saveCalendarInviteToHistory } from '../services/calendarInviteHistoryService'
import { sendCalendarInvite } from '../services/calendarInviteService'
import { getAllTemplates } from '../services/templateRepositoryService'
import { prepareEmailFromTemplate } from '../services/templateService'
import { parseEmailList, validateEmailList } from '../utils/emailUtils'
import { sanitizeHtml } from '../utils/sanitizer'
import {
  calculateEndTime,
  formatLongDate,
  format12HourTime,
  combineDateAndTime,
  parse12HourTimeTo24Hour,
} from '../utils/timeUtils'
import { getBrowserTimezone, getTimezoneOptions } from '../utils/timezoneUtils'

const settingsRepository = new LocalStorageSettingsRepository()

function CalendarInvites() {
  const { showAlert, showConfirm } = useAlert()
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  // Calendar-specific fields
  const [recipient, setRecipient] = useState('')
  const [cc, setCc] = useState('')
  const [subject, setSubject] = useState('')
  const [date, setDate] = useState('')
  const [time12h, setTime12h] = useState('02:00 PM')
  const [timezone, setTimezone] = useState(getBrowserTimezone())
  const [durationInMinutes, setDurationInMinutes] = useState('60')
  const [parameterValues, setParameterValues] = useState({})

  // Attachment fields (now supports multiple files)
  const [attachmentFiles, setAttachmentFiles] = useState([])

  // Preview and validation
  const [htmlBody, setHtmlBody] = useState('')
  const [recipientError, setRecipientError] = useState('')
  const [ccError, setCcError] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [webhookConfigured, setWebhookConfigured] = useState(false)
  const [signature, setSignature] = useState('')
  const [appendSignature, setAppendSignature] = useState(false)

  const loadTemplates = useCallback(async () => {
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
  }, [showAlert])

  const loadSettings = useCallback(async () => {
    try {
      const settings = await settingsRepository.getSettings()
      const isConfigured =
        settings.calendarWebhook?.url && settings.calendarWebhook.url.trim() !== ''
      setWebhookConfigured(isConfigured)

      // Load default timezone from settings (fallback to browser timezone)
      const defaultTimezone = settings.defaultTimezone || getBrowserTimezone()
      setTimezone(defaultTimezone)

      // Load signature
      const sig = settings.signature || ''
      setSignature(sig)
      // Set appendSignature to true by default if signature exists
      setAppendSignature(sig.trim() !== '')
    } catch (error) {
      console.error('Error loading settings:', error)
      setWebhookConfigured(false)
    }
  }, [])

  // Load templates and settings on mount
  useEffect(() => {
    loadTemplates()
    loadSettings()
  }, [loadTemplates, loadSettings])

  // Convert 12-hour time to 24-hour and combine with date (memoized to prevent infinite re-renders)
  const startTime = useMemo(() => {
    const time24h = parse12HourTimeTo24Hour(time12h)
    return combineDateAndTime(date, time24h)
  }, [date, time12h])

  // Calculate end time from start time and duration using utility function (memoized)
  const endTime = useMemo(() => {
    return calculateEndTime(startTime, durationInMinutes)
  }, [startTime, durationInMinutes])

  // Update preview when template or parameters change
  useEffect(() => {
    if (selectedTemplate) {
      // Prepare formatted values for template substitution
      const allParams = {
        ...parameterValues,
        date: formatLongDate(startTime),
        startTime: format12HourTime(startTime),
        endTime: format12HourTime(endTime),
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
  }, [selectedTemplate, parameterValues, startTime, endTime, timezone, durationInMinutes])

  const handleTemplateSelect = template => {
    setSelectedTemplate(template)
    const initialValues = {}
    if (template.parameters) {
      template.parameters.forEach(param => {
        // Skip predefined calendar parameters
        if (!['date', 'startTime', 'endTime', 'timezone', 'durationInMinutes'].includes(param)) {
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

  const handleCcChange = value => {
    setCc(value)

    if (value.trim()) {
      const validation = validateEmailList(value)
      if (!validation.isValid) {
        setCcError(`Invalid email(s): ${validation.invalidEmails.join(', ')}`)
      } else {
        setCcError('')
      }
    } else {
      setCcError('')
    }
  }

  const handleFileChange = e => {
    const files = Array.from(e.target.files)
    if (files.length === 0) {
      return
    }

    // Validate each file
    const validFiles = []
    for (const file of files) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        showAlert({
          title: 'Invalid File Type',
          message: `${file.name}: Only PDF files are allowed`,
          type: 'warning',
        })
        continue
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert({
          title: 'File Too Large',
          message: `${file.name}: File size must be less than 5MB`,
          type: 'warning',
        })
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length === 0) {
      e.target.value = ''
      return
    }

    // Add new files to existing list
    setAttachmentFiles(prev => [...prev, ...validFiles])

    // Clear the input
    e.target.value = ''
  }

  const handleRemoveFile = index => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index))
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

    // Validate CC if provided
    if (cc.trim()) {
      const ccValidation = validateEmailList(cc)
      if (!ccValidation.isValid) {
        showAlert({
          title: 'Validation Error',
          message: `Invalid CC email(s): ${ccValidation.invalidEmails.join(', ')}`,
          type: 'warning',
        })
        return
      }
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

    if (!date) {
      showAlert({
        title: 'Validation Error',
        message: 'Please select a date',
        type: 'warning',
      })
      return
    }

    if (!time12h) {
      showAlert({
        title: 'Validation Error',
        message: 'Please enter a start time',
        type: 'warning',
      })
      return
    }

    // Validate time format
    if (!parse12HourTimeTo24Hour(time12h)) {
      showAlert({
        title: 'Validation Error',
        message: 'Invalid time format. Please use HH:MM AM/PM (e.g., 02:00 PM)',
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
      // Combine recipient and CC emails for the 'to' field
      const toEmails = [recipient.trim()]
      if (cc.trim()) {
        const ccEmails = parseEmailList(cc)
        toEmails.push(...ccEmails)
      }

      // Append signature if checkbox is checked and signature exists
      let finalMessage = htmlBody
      if (appendSignature && signature && signature.trim() !== '') {
        finalMessage = htmlBody + '\n' + signature
      }

      const calendarInviteBody = {
        subject,
        to: toEmails.join(', '),
        message: finalMessage,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        timezone,
      }

      // Convert attachments to base64 if present
      if (attachmentFiles.length > 0) {
        const base64Promises = attachmentFiles.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const base64 = reader.result.split(',')[1]
              resolve({ name: file.name, fileBase64: base64 })
            }
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
        })

        try {
          const attachmentBase64List = await Promise.all(base64Promises)
          calendarInviteBody.attachments = attachmentBase64List
        } catch (error) {
          console.error('Error converting files to base64:', error)
          showAlert({
            title: 'Error',
            message: 'Failed to process attachment files',
            type: 'danger',
          })
          setSending(false)
          return
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
            attachmentName: attachmentFiles.map(f => f.name).join(', '),
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

      // Reset form - reload default timezone from settings
      setSelectedTemplate(null)
      setRecipient('')
      setCc('')
      setSubject('')
      setDate('')
      setTime12h('02:00 PM')
      setDurationInMinutes('60')
      setParameterValues({})
      setAttachmentFiles([])
      setRecipientError('')
      setCcError('')
      // Reload timezone from settings
      loadSettings()
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

  // Build timezone options using utility function
  const timezoneOptions = useMemo(() => getTimezoneOptions(), [])

  // Get non-predefined parameters
  const otherParameters = useMemo(() => {
    if (!selectedTemplate?.parameters) return []
    return selectedTemplate.parameters.filter(
      param => !['date', 'startTime', 'endTime', 'timezone', 'durationInMinutes'].includes(param)
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
                      Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      Start Time <span className="text-danger">*</span>
                    </label>
                    <TimePickerInput value={time12h} onChange={setTime12h} />
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
                        <strong>End Time:</strong> {format12HourTime(endTime)}
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
                    <label className="form-label">CC (Optional)</label>
                    <input
                      type="text"
                      className={`form-control ${ccError ? 'is-invalid' : ''}`}
                      value={cc}
                      onChange={e => handleCcChange(e.target.value)}
                      placeholder="user1@example.com, user2@example.com"
                    />
                    {ccError ? (
                      <div className="invalid-feedback">{ccError}</div>
                    ) : (
                      <div className="form-text">Enter comma-separated email addresses</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Attachments (Optional)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf"
                      onChange={handleFileChange}
                      multiple
                    />
                    <div className="form-text">
                      PDF files only, max 5MB per file. Multiple files allowed.
                    </div>

                    {attachmentFiles.length > 0 && (
                      <div className="mt-2">
                        <label className="form-label fw-bold small">Attached files:</label>
                        <ul className="list-group">
                          {attachmentFiles.map((file, index) => (
                            <li
                              key={index}
                              className="list-group-item d-flex justify-content-between align-items-center py-2"
                            >
                              <span className="text-success">
                                ✓ {file.name} ({(file.size / 1024).toFixed(0)} KB)
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveFile(index)}
                                title="Remove file"
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {signature && signature.trim() !== '' && (
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="appendSignatureCheckbox"
                          checked={appendSignature}
                          onChange={e => setAppendSignature(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="appendSignatureCheckbox">
                          Append email signature
                        </label>
                      </div>
                    </div>
                  )}

                  <button
                    className="btn btn-primary w-100"
                    onClick={handleSendInvite}
                    disabled={
                      sending ||
                      !recipient.trim() ||
                      !subject.trim() ||
                      !!recipientError ||
                      !!ccError
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
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Date:</label>
                    <div className="p-2 bg-light rounded border">
                      {startTime ? (
                        formatLongDate(startTime)
                      ) : (
                        <span className="text-muted">Not set</span>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Timezone:</label>
                    <div className="p-2 bg-light rounded border">{timezone}</div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Start Time:</label>
                    <div className="p-2 bg-light rounded border">
                      {startTime ? (
                        format12HourTime(startTime)
                      ) : (
                        <span className="text-muted">Not set</span>
                      )}
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">End Time:</label>
                    <div className="p-2 bg-light rounded border">
                      {endTime ? (
                        format12HourTime(endTime)
                      ) : (
                        <span className="text-muted">Not set</span>
                      )}
                    </div>
                  </div>
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
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(
                        appendSignature && signature && signature.trim() !== ''
                          ? htmlBody + '\n' + signature
                          : htmlBody
                      ),
                    }}
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
