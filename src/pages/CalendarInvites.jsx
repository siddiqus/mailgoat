import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PageCard from '../components/PageCard'
import PageContainer from '../components/PageContainer'
import SearchableSelect from '../components/SearchableSelect'
import TimePickerInput from '../components/TimePickerInput'
import Tabs from '../components/ui/Tabs'
import { useAlert } from '../contexts/AlertContext'
import LocalStorageSettingsRepository from '../repositories/LocalStorageSettingsRepository'
import { saveCalendarInviteToHistory } from '../services/calendarInviteHistoryService'
import {
  sendCalendarInvite,
  prepareBulkCalendarInviteData,
  sendBulkCalendarInvitesAsync,
} from '../services/calendarInviteService'
import { saveDraft, loadDraft, clearDraft, hasDraft, DRAFT_KEYS } from '../services/draftService'
import { parseFile, validateDataRows } from '../services/fileParsingService'
import { getAllTemplates } from '../services/templateRepositoryService'
import {
  prepareEmailFromTemplate,
  generateSampleCSV,
  downloadCSV,
} from '../services/templateService'
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
  const navigate = useNavigate()
  const { showAlert, showConfirm } = useAlert()
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  // Single invite fields
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

  // Bulk invite state
  const [bulkTemplate, setBulkTemplate] = useState(null)
  const [bulkInputMode, setBulkInputMode] = useState('file') // 'file' or 'manual'
  const [uploadedFile, setUploadedFile] = useState(null)
  const [fileData, setFileData] = useState([])
  const [fileErrors, setFileErrors] = useState([])
  const [previewIndex, setPreviewIndex] = useState(null)
  const [manualEntries, setManualEntries] = useState([])

  // Bulk calendar details (shared across all invites)
  const [bulkDate, setBulkDate] = useState('')
  const [bulkTime12h, setBulkTime12h] = useState('02:00 PM')
  const [bulkTimezone, setBulkTimezone] = useState(getBrowserTimezone())
  const [bulkDurationInMinutes, setBulkDurationInMinutes] = useState('60')

  // Draft state
  const [currentTab, setCurrentTab] = useState('single')
  const [draftLoaded, setDraftLoaded] = useState(false)

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

  // Load draft after templates are loaded
  useEffect(() => {
    if (!loading && templates.length > 0 && !draftLoaded) {
      loadDraftData()
      setDraftLoaded(true)
    }
  }, [loading, templates, draftLoaded])

  // Auto-save single calendar invite draft
  useEffect(() => {
    if (draftLoaded && currentTab === 'single') {
      const draftData = {
        templateId: selectedTemplate?.id,
        recipient,
        cc,
        date,
        time12h,
        timezone,
        durationInMinutes,
        parameterValues,
        appendSignature,
      }
      // Only save if there's some data
      if (selectedTemplate || recipient || cc || date || Object.keys(parameterValues).length > 0) {
        saveDraft(DRAFT_KEYS.CALENDAR_INVITE_SINGLE, draftData)
      }
    }
  }, [
    selectedTemplate,
    recipient,
    cc,
    date,
    time12h,
    timezone,
    durationInMinutes,
    parameterValues,
    appendSignature,
    draftLoaded,
    currentTab,
  ])

  // Auto-save bulk calendar invite draft
  useEffect(() => {
    if (draftLoaded && currentTab === 'bulk') {
      const draftData = {
        templateId: bulkTemplate?.id,
        bulkInputMode,
        bulkDate,
        bulkTime12h,
        bulkTimezone,
        bulkDurationInMinutes,
        manualEntries,
        fileData: bulkInputMode === 'file' ? fileData : [],
      }
      // Only save if there's some data
      if (bulkTemplate || manualEntries.length > 0 || fileData.length > 0 || bulkDate) {
        saveDraft(DRAFT_KEYS.CALENDAR_INVITE_BULK, draftData)
      }
    }
  }, [
    bulkTemplate,
    bulkInputMode,
    bulkDate,
    bulkTime12h,
    bulkTimezone,
    bulkDurationInMinutes,
    manualEntries,
    fileData,
    draftLoaded,
    currentTab,
  ])

  const loadDraftData = () => {
    // Load single calendar invite draft
    const singleDraft = loadDraft(DRAFT_KEYS.CALENDAR_INVITE_SINGLE)
    if (singleDraft) {
      if (singleDraft.templateId) {
        const template = templates.find(t => t.id === singleDraft.templateId)
        if (template) {
          setSelectedTemplate(template)
          const initialValues = {}
          if (template.parameters) {
            template.parameters.forEach(param => {
              if (
                !['date', 'startTime', 'endTime', 'timezone', 'durationInMinutes'].includes(param)
              ) {
                initialValues[param] = singleDraft.parameterValues?.[param] || ''
              }
            })
          }
          setParameterValues(initialValues)
        }
      }
      if (singleDraft.recipient) {
        setRecipient(singleDraft.recipient)
      }
      if (singleDraft.cc) {
        setCc(singleDraft.cc)
      }
      if (singleDraft.date) {
        setDate(singleDraft.date)
      }
      if (singleDraft.time12h) {
        setTime12h(singleDraft.time12h)
      }
      if (singleDraft.timezone) {
        setTimezone(singleDraft.timezone)
      }
      if (singleDraft.durationInMinutes) {
        setDurationInMinutes(singleDraft.durationInMinutes)
      }
      if (typeof singleDraft.appendSignature === 'boolean') {
        setAppendSignature(singleDraft.appendSignature)
      }
    }

    // Load bulk calendar invite draft
    const bulkDraft = loadDraft(DRAFT_KEYS.CALENDAR_INVITE_BULK)
    if (bulkDraft) {
      if (bulkDraft.templateId) {
        const template = templates.find(t => t.id === bulkDraft.templateId)
        if (template) {
          setBulkTemplate(template)
        }
      }
      if (bulkDraft.bulkInputMode) {
        setBulkInputMode(bulkDraft.bulkInputMode)
      }
      if (bulkDraft.bulkDate) {
        setBulkDate(bulkDraft.bulkDate)
      }
      if (bulkDraft.bulkTime12h) {
        setBulkTime12h(bulkDraft.bulkTime12h)
      }
      if (bulkDraft.bulkTimezone) {
        setBulkTimezone(bulkDraft.bulkTimezone)
      }
      if (bulkDraft.bulkDurationInMinutes) {
        setBulkDurationInMinutes(bulkDraft.bulkDurationInMinutes)
      }
      if (bulkDraft.manualEntries && bulkDraft.manualEntries.length > 0) {
        setManualEntries(bulkDraft.manualEntries)
      }
      if (bulkDraft.fileData && bulkDraft.fileData.length > 0) {
        setFileData(bulkDraft.fileData)
      }
    }
  }

  const clearCurrentDraft = () => {
    if (currentTab === 'single') {
      clearDraft(DRAFT_KEYS.CALENDAR_INVITE_SINGLE)
      setSelectedTemplate(null)
      setRecipient('')
      setCc('')
      setDate('')
      setTime12h('02:00 PM')
      setTimezone(getBrowserTimezone())
      setDurationInMinutes('60')
      setParameterValues({})
      setAttachmentFiles([])
      setRecipientError('')
      setCcError('')
    } else {
      clearDraft(DRAFT_KEYS.CALENDAR_INVITE_BULK)
      setBulkTemplate(null)
      setBulkInputMode('file')
      setBulkDate('')
      setBulkTime12h('02:00 PM')
      setBulkTimezone(getBrowserTimezone())
      setBulkDurationInMinutes('60')
      setUploadedFile(null)
      setFileData([])
      setFileErrors([])
      setPreviewIndex(null)
      setManualEntries([])
    }
  }

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
          calendarInviteBody.attachedFiles = attachmentBase64List
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
            cc: cc.trim() || undefined,
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

      // Clear draft on successful send
      clearDraft(DRAFT_KEYS.CALENDAR_INVITE_SINGLE)

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

  // Bulk calendar invite functions
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
        // Skip predefined calendar parameters
        if (!['date', 'startTime', 'endTime', 'timezone', 'durationInMinutes'].includes(param)) {
          newEntry[param] = ''
        }
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
          // Skip predefined calendar parameters
          if (!['date', 'startTime', 'endTime', 'timezone', 'durationInMinutes'].includes(param)) {
            if (!entry[param] || !entry[param].trim()) {
              errors.push(`Row ${index + 1}: ${param} is required`)
            }
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
      // Validate data rows - filter out predefined calendar parameters
      const bulkParams = bulkTemplate?.parameters?.filter(
        param => !['date', 'startTime', 'endTime', 'timezone', 'durationInMinutes'].includes(param)
      )
      const errors = validateDataRows(data, bulkParams)

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

    // Calculate start and end times for preview
    const time24h = parse12HourTimeTo24Hour(bulkTime12h)
    const bulkStartTime = combineDateAndTime(bulkDate, time24h)
    const bulkEndTime = calculateEndTime(bulkStartTime, bulkDurationInMinutes)

    // Prepare parameters for template
    const allParams = {
      ...rowData,
      date: formatLongDate(bulkStartTime),
      startTime: format12HourTime(bulkStartTime),
      endTime: format12HourTime(bulkEndTime),
      timezone: bulkTimezone,
      durationInMinutes: bulkDurationInMinutes,
    }

    return prepareEmailFromTemplate(bulkTemplate, allParams)
  }

  const handleBulkSend = async () => {
    if (!bulkTemplate) {
      showAlert({
        title: 'Validation Error',
        message: 'Please select a template',
        type: 'warning',
      })
      return
    }

    // Validate bulk calendar details
    if (!bulkDate) {
      showAlert({
        title: 'Validation Error',
        message: 'Please select a date for the calendar invites',
        type: 'warning',
      })
      return
    }

    if (!bulkTime12h) {
      showAlert({
        title: 'Validation Error',
        message: 'Please enter a start time',
        type: 'warning',
      })
      return
    }

    if (!parse12HourTimeTo24Hour(bulkTime12h)) {
      showAlert({
        title: 'Validation Error',
        message: 'Invalid time format. Please use HH:MM AM/PM (e.g., 02:00 PM)',
        type: 'warning',
      })
      return
    }

    if (!bulkDurationInMinutes || parseInt(bulkDurationInMinutes, 10) <= 0) {
      showAlert({
        title: 'Validation Error',
        message: 'Please enter a valid duration',
        type: 'warning',
      })
      return
    }

    let dataToSend = []
    let inviteCount = 0

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
      inviteCount = fileData.length
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
      inviteCount = manualEntries.length
    }

    const confirmed = await showConfirm({
      title: 'Confirm Bulk Send',
      message: `You are about to send ${inviteCount} calendar invites. The invites will be sent in the background. Continue?`,
      type: 'warning',
      confirmText: 'Send Invites',
      cancelText: 'Cancel',
    })
    if (!confirmed) return

    setSending(true)
    try {
      // Calculate start and end times
      const time24h = parse12HourTimeTo24Hour(bulkTime12h)
      const bulkStartTime = combineDateAndTime(bulkDate, time24h)
      const bulkEndTime = calculateEndTime(bulkStartTime, bulkDurationInMinutes)

      // Add startTime and endTime to each data row
      const enrichedData = dataToSend.map(row => ({
        ...row,
        startTime: new Date(bulkStartTime).toISOString(),
        endTime: new Date(bulkEndTime).toISOString(),
        timezone: bulkTimezone,
      }))

      const bulkInviteData = prepareBulkCalendarInviteData(
        enrichedData,
        bulkTemplate,
        formatLongDate(bulkStartTime),
        format12HourTime(bulkStartTime),
        bulkDurationInMinutes,
        bulkTimezone
      )

      await sendBulkCalendarInvitesAsync(bulkInviteData, bulkTemplate)

      console.log(
        `Started sending ${inviteCount} calendar invites in the background. Redirecting to History page...`
      )

      // Clear draft on successful send
      clearDraft(DRAFT_KEYS.CALENDAR_INVITE_BULK)

      const queryParams = new URLSearchParams()
      if (bulkTemplate?.id) {
        queryParams.set('template', bulkTemplate.id)
      }

      navigate(`/history?${queryParams.toString()}`)
    } catch (error) {
      console.error('Error initiating bulk calendar invite send:', error)
      showAlert({
        title: 'Error',
        message: `Failed to initiate bulk calendar invite send: ${error.message}`,
        type: 'danger',
      })
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

      {(hasDraft(DRAFT_KEYS.CALENDAR_INVITE_SINGLE) ||
        hasDraft(DRAFT_KEYS.CALENDAR_INVITE_BULK)) && (
        <div className="alert alert-info d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              className="me-2"
              viewBox="0 0 16 16"
            >
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
            </svg>
            <span>
              <strong>Draft saved!</strong> Your progress has been automatically saved.
            </span>
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={clearCurrentDraft}>
            Discard Draft
          </button>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="alert alert-info">
          No calendar templates available. Please create a calendar template first in the Templates
          page.
        </div>
      ) : (
        <Tabs defaultTab="single" onTabChange={setCurrentTab}>
          <Tabs.Tab value="single" label="Send Single Invite">
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
                        <div className="position-relative">
                          <input
                            type="text"
                            className="form-control"
                            value={date && startTime ? formatLongDate(startTime) : ''}
                            placeholder="Select a date"
                            readOnly
                            onClick={() => document.getElementById('hiddenDateInput').showPicker()}
                            style={{ cursor: 'pointer' }}
                          />
                          <input
                            id="hiddenDateInput"
                            type="date"
                            className="position-absolute"
                            style={{ opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                            value={date}
                            onChange={e => setDate(e.target.value)}
                          />
                        </div>
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
                    <div className="mb-3">
                      <label className="form-label fw-bold">Recipient:</label>
                      <div className="p-2 bg-light rounded border">
                        {recipient || <span className="text-muted">Not set</span>}
                      </div>
                    </div>
                    {cc && cc.trim() && (
                      <div className="mb-3">
                        <label className="form-label fw-bold">CC:</label>
                        <div className="p-2 bg-light rounded border">{cc}</div>
                      </div>
                    )}
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
          </Tabs.Tab>

          <Tabs.Tab value="bulk" label="Bulk Send Invites">
            <div className="row mb-3">
              <div className="col-md-6">
                <PageCard header="1. Select Template">
                  <SearchableSelect
                    options={templateOptions}
                    value={bulkTemplate?.id || ''}
                    onChange={value => {
                      const template = templates.find(t => t.id === value)
                      handleBulkTemplateSelect(template || null)
                    }}
                    placeholder="-- Select a calendar template --"
                    allowClear={false}
                  />
                  <div className="form-text mt-2">Select a template to start</div>
                </PageCard>
              </div>

              <div className="col-md-6">
                <PageCard header="2. Input Method">
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

            {bulkTemplate && (
              <PageCard header="3. Calendar Details (Applies to All Invites)" className="mb-3">
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <label className="form-label">
                      Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={bulkDate}
                      onChange={e => setBulkDate(e.target.value)}
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">
                      Start Time <span className="text-danger">*</span>
                    </label>
                    <TimePickerInput value={bulkTime12h} onChange={setBulkTime12h} />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">
                      Duration (minutes) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={bulkDurationInMinutes}
                      onChange={e => setBulkDurationInMinutes(e.target.value)}
                      min="1"
                      placeholder="60"
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label">
                      Timezone <span className="text-danger">*</span>
                    </label>
                    <SearchableSelect
                      options={timezoneOptions}
                      value={bulkTimezone}
                      onChange={value => setBulkTimezone(value)}
                      placeholder="Select timezone"
                      allowClear={false}
                    />
                  </div>
                </div>
              </PageCard>
            )}

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
                  {bulkTemplate.parameters &&
                    bulkTemplate.parameters.filter(
                      param =>
                        !['date', 'startTime', 'endTime', 'timezone', 'durationInMinutes'].includes(
                          param
                        )
                    ).length > 0 && (
                      <>
                        ,{' '}
                        {bulkTemplate.parameters
                          .filter(
                            param =>
                              ![
                                'date',
                                'startTime',
                                'endTime',
                                'timezone',
                                'durationInMinutes',
                              ].includes(param)
                          )
                          .join(', ')}
                      </>
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
                          `Send ${manualEntries.length} Invite${manualEntries.length !== 1 ? 's' : ''}`
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
                          {bulkTemplate?.parameters
                            ?.filter(
                              param =>
                                ![
                                  'date',
                                  'startTime',
                                  'endTime',
                                  'timezone',
                                  'durationInMinutes',
                                ].includes(param)
                            )
                            .map(param => (
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
                            {bulkTemplate?.parameters
                              ?.filter(
                                param =>
                                  ![
                                    'date',
                                    'startTime',
                                    'endTime',
                                    'timezone',
                                    'durationInMinutes',
                                  ].includes(param)
                              )
                              .map(param => (
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
                      `Send ${fileData.length} Invites`
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
                        {bulkTemplate?.parameters
                          ?.filter(
                            param =>
                              ![
                                'date',
                                'startTime',
                                'endTime',
                                'timezone',
                                'durationInMinutes',
                              ].includes(param)
                          )
                          .map(param => (
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
                          {bulkTemplate?.parameters
                            ?.filter(
                              param =>
                                ![
                                  'date',
                                  'startTime',
                                  'endTime',
                                  'timezone',
                                  'durationInMinutes',
                                ].includes(param)
                            )
                            .map(param => (
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
                        <h5 className="modal-title">
                          Calendar Invite Preview - Record #{previewIndex + 1}
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

                          // Calculate times for preview
                          const time24h = parse12HourTimeTo24Hour(bulkTime12h)
                          const bulkStartTime = combineDateAndTime(bulkDate, time24h)
                          const bulkEndTime = calculateEndTime(bulkStartTime, bulkDurationInMinutes)

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

                              <div className="row">
                                <div className="col-md-6 mb-3">
                                  <label className="form-label fw-bold">Date:</label>
                                  <div className="p-2 bg-light rounded border">
                                    {bulkStartTime ? (
                                      formatLongDate(bulkStartTime)
                                    ) : (
                                      <span className="text-muted">Not set</span>
                                    )}
                                  </div>
                                </div>
                                <div className="col-md-6 mb-3">
                                  <label className="form-label fw-bold">Timezone:</label>
                                  <div className="p-2 bg-light rounded border">{bulkTimezone}</div>
                                </div>
                              </div>

                              <div className="row">
                                <div className="col-md-6 mb-3">
                                  <label className="form-label fw-bold">Start Time:</label>
                                  <div className="p-2 bg-light rounded border">
                                    {bulkStartTime ? (
                                      format12HourTime(bulkStartTime)
                                    ) : (
                                      <span className="text-muted">Not set</span>
                                    )}
                                  </div>
                                </div>
                                <div className="col-md-6 mb-3">
                                  <label className="form-label fw-bold">End Time:</label>
                                  <div className="p-2 bg-light rounded border">
                                    {bulkEndTime ? (
                                      format12HourTime(bulkEndTime)
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

export default CalendarInvites
