import { useState, useEffect } from 'react'
import LocalStorageSettingsRepository from '../repositories/LocalStorageSettingsRepository'
import { testWebhook } from '../services/emailService'
import './Settings.css'

const settingsRepository = new LocalStorageSettingsRepository()

function Settings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('webhook')

  // Webhook settings
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookHeaders, setWebhookHeaders] = useState([])
  const [bodyMapping, setBodyMapping] = useState({
    recipients: 'recipients',
    ccList: 'ccList',
    subject: 'subject',
    htmlBody: 'message',
  })

  // Supabase settings
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')

  // Other settings
  const [pixelTrackingEnabled, setPixelTrackingEnabled] = useState(true)

  // Import/Export state
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const data = await settingsRepository.getSettings()
      setSettings(data)
      setWebhookUrl(data.webhook.url || '')
      setWebhookHeaders(data.webhook.headers || [])
      setBodyMapping(
        data.webhook.bodyMapping || {
          recipients: 'recipients',
          ccList: 'ccList',
          subject: 'subject',
          htmlBody: 'message',
        }
      )

      // Load Supabase settings
      setSupabaseUrl(data.supabase?.url || '')
      setSupabaseKey(data.supabase?.key || '')

      // Load other settings
      setPixelTrackingEnabled(data.pixelTracking?.enabled ?? true)
    } catch (error) {
      console.error('Error loading settings:', error)
      alert('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleAddHeader = () => {
    setWebhookHeaders([...webhookHeaders, { key: '', value: '' }])
  }

  const handleRemoveHeader = index => {
    const newHeaders = webhookHeaders.filter((_, i) => i !== index)
    setWebhookHeaders(newHeaders)
  }

  const handleHeaderChange = (index, field, value) => {
    const newHeaders = [...webhookHeaders]
    newHeaders[index][field] = value
    setWebhookHeaders(newHeaders)
  }

  const handleBodyMappingChange = (field, value) => {
    setBodyMapping({
      ...bodyMapping,
      [field]: value,
    })
  }

  const handleSave = async () => {
    if (activeTab === 'webhook') {
      // Validate webhook URL
      if (!webhookUrl.trim()) {
        alert('Please enter a webhook URL')
        return
      }

      try {
        new URL(webhookUrl)
      } catch (error) {
        alert('Please enter a valid URL')
        return
      }

      setSaving(true)
      try {
        const updatedSettings = {
          ...settings,
          webhook: {
            url: webhookUrl,
            headers: webhookHeaders.filter(h => h.key.trim() !== ''),
            bodyMapping: bodyMapping,
          },
        }

        await settingsRepository.saveSettings(updatedSettings)
        setSettings(updatedSettings)
        alert('Webhook settings saved successfully!')
      } catch (error) {
        console.error('Error saving settings:', error)
        alert('Failed to save settings')
      } finally {
        setSaving(false)
      }
    } else if (activeTab === 'supabase') {
      // Validate Supabase settings
      if (!supabaseUrl.trim()) {
        alert('Please enter a Supabase URL')
        return
      }

      if (!supabaseKey.trim()) {
        alert('Please enter a Supabase key')
        return
      }

      try {
        new URL(supabaseUrl)
      } catch (error) {
        alert('Please enter a valid Supabase URL')
        return
      }

      setSaving(true)
      try {
        const updatedSettings = {
          ...settings,
          supabase: {
            url: supabaseUrl,
            key: supabaseKey,
          },
        }

        await settingsRepository.saveSettings(updatedSettings)
        setSettings(updatedSettings)
        alert('Supabase settings saved successfully!')
      } catch (error) {
        console.error('Error saving settings:', error)
        alert('Failed to save settings')
      } finally {
        setSaving(false)
      }
    } else if (activeTab === 'others') {
      setSaving(true)
      try {
        const updatedSettings = {
          ...settings,
          pixelTracking: {
            enabled: pixelTrackingEnabled,
          },
        }

        await settingsRepository.saveSettings(updatedSettings)
        setSettings(updatedSettings)
        alert('Settings saved successfully!')
      } catch (error) {
        console.error('Error saving settings:', error)
        alert('Failed to save settings')
      } finally {
        setSaving(false)
      }
    }
  }

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      alert('Please enter a webhook URL first')
      return
    }

    setSaving(true)
    try {
      const result = await testWebhook(webhookUrl, webhookHeaders, bodyMapping)

      if (result.ok) {
        alert('Test webhook sent successfully! Check your webhook endpoint.')
      } else {
        alert(`Webhook test failed with status: ${result.status}`)
      }
    } catch (error) {
      console.error('Error testing webhook:', error)
      alert(`Failed to test webhook: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleExportSettings = () => {
    try {
      // Get current settings
      const exportData = {
        ...settings,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      }

      // Create a blob with the JSON data
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      })

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mailgoat-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      alert('Settings exported successfully!')
    } catch (error) {
      console.error('Error exporting settings:', error)
      alert('Failed to export settings')
    }
  }

  const handleImportSettings = event => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    const reader = new FileReader()

    reader.onload = async e => {
      try {
        const importedData = JSON.parse(e.target.result)

        // Validate the imported data
        if (!importedData || typeof importedData !== 'object') {
          throw new Error('Invalid settings file format')
        }

        // Validate required fields
        const requiredFields = ['webhook', 'supabase']
        for (const field of requiredFields) {
          if (!importedData[field]) {
            throw new Error(`Missing required field: ${field}`)
          }
        }

        // Merge with default settings to ensure all fields exist
        const validatedSettings = {
          emailProvider: importedData.emailProvider || 'webhook',
          webhook: {
            url: importedData.webhook?.url || '',
            headers: Array.isArray(importedData.webhook?.headers)
              ? importedData.webhook.headers
              : [],
            bodyMapping: {
              recipients: importedData.webhook?.bodyMapping?.recipients || 'recipients',
              ccList: importedData.webhook?.bodyMapping?.ccList || 'ccList',
              subject: importedData.webhook?.bodyMapping?.subject || 'subject',
              htmlBody: importedData.webhook?.bodyMapping?.htmlBody || 'message',
            },
          },
          smtp: {
            host: importedData.smtp?.host || '',
            port: importedData.smtp?.port || 587,
            secure: importedData.smtp?.secure || false,
            username: importedData.smtp?.username || '',
            password: importedData.smtp?.password || '',
            fromEmail: importedData.smtp?.fromEmail || '',
            fromName: importedData.smtp?.fromName || '',
          },
          supabase: {
            url: importedData.supabase?.url || '',
            key: importedData.supabase?.key || '',
          },
          pixelTracking: {
            enabled: importedData.pixelTracking?.enabled ?? true,
          },
          createdAt: importedData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Save the imported settings
        await settingsRepository.saveSettings(validatedSettings)

        // Reload settings from storage
        await loadSettings()

        alert('Settings imported successfully! The page will reload.')
        window.location.reload()
      } catch (error) {
        console.error('Error importing settings:', error)
        alert(`Failed to import settings: ${error.message}`)
      } finally {
        setImporting(false)
        // Reset file input
        event.target.value = ''
      }
    }

    reader.onerror = () => {
      alert('Failed to read file')
      setImporting(false)
      event.target.value = ''
    }

    reader.readAsText(file)
  }

  if (loading) {
    return (
      <div className="settings-container">
        <div className="settings-inner">
          <div className="settings-loading">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-container">
      <div className="settings-inner">
        <h2 className="mb-4">Settings</h2>

        {/* Tabs Navigation */}
        <div className="settings-tabs">
          <button
            className={`settings-tab-button ${activeTab === 'webhook' ? 'active' : ''}`}
            onClick={() => setActiveTab('webhook')}
          >
            Email Webhook
          </button>
          <button
            className={`settings-tab-button ${activeTab === 'supabase' ? 'active' : ''}`}
            onClick={() => setActiveTab('supabase')}
          >
            Supabase Integration
          </button>
          <button
            className={`settings-tab-button ${activeTab === 'import-export' ? 'active' : ''}`}
            onClick={() => setActiveTab('import-export')}
          >
            Import/Export
          </button>
          <button
            className={`settings-tab-button ${activeTab === 'others' ? 'active' : ''}`}
            onClick={() => setActiveTab('others')}
          >
            Others
          </button>
        </div>

        <div className="settings-content">
          {/* Webhook Tab */}
          {activeTab === 'webhook' && (
            <div className="row">
              <div className="col-lg-8">
                <div className="settings-card">
                  <div className="settings-card-header">
                    <h5 className="mb-0">Webhook Configuration</h5>
                  </div>
                  <div className="settings-card-body">
                    {/* Webhook URL */}
                    <div className="mb-4">
                      <label className="form-label fw-bold">
                        Webhook URL <span className="text-danger">*</span>
                      </label>
                      <input
                        type="url"
                        className="form-control"
                        value={webhookUrl}
                        onChange={e => setWebhookUrl(e.target.value)}
                        placeholder="https://api.example.com/send-email"
                      />
                      <div className="form-text">
                        Enter the endpoint URL where email requests will be sent
                      </div>
                    </div>

                    {/* Request Body Mapping */}
                    <div className="mb-4">
                      <label className="form-label fw-bold">Request Body Property Mapping</label>
                      <div className="form-text mb-3">
                        Configure the property names that will be sent in the webhook request body.
                        Enter the desired property name for each email field.
                      </div>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">
                            Recipients Property Name
                            <span className="text-muted ms-2 small">(email recipients list)</span>
                          </label>
                          <input
                            type="text"
                            className="form-control font-monospace"
                            value={bodyMapping.recipients}
                            onChange={e => handleBodyMappingChange('recipients', e.target.value)}
                            placeholder="recipients"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">
                            CC List Property Name
                            <span className="text-muted ms-2 small">(email CC list)</span>
                          </label>
                          <input
                            type="text"
                            className="form-control font-monospace"
                            value={bodyMapping.ccList}
                            onChange={e => handleBodyMappingChange('ccList', e.target.value)}
                            placeholder="ccList"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">
                            Subject Property Name
                            <span className="text-muted ms-2 small">(email subject)</span>
                          </label>
                          <input
                            type="text"
                            className="form-control font-monospace"
                            value={bodyMapping.subject}
                            onChange={e => handleBodyMappingChange('subject', e.target.value)}
                            placeholder="subject"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">
                            HTML Body Property Name
                            <span className="text-muted ms-2 small">(email HTML content)</span>
                          </label>
                          <input
                            type="text"
                            className="form-control font-monospace"
                            value={bodyMapping.htmlBody}
                            onChange={e => handleBodyMappingChange('message', e.target.value)}
                            placeholder="htmlBody"
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <details className="text-muted small">
                          <summary className="cursor-pointer" style={{ cursor: 'pointer' }}>
                            How does property mapping work?
                          </summary>
                          <div className="mt-2 ps-3">
                            <p>
                              The property mapping allows you to customize the JSON property names
                              sent to your webhook.
                            </p>
                            <p>
                              <strong>Example:</strong>
                            </p>
                            <p>If you want to send data in this format:</p>
                            <pre className="bg-light p-2 rounded">
                              <code>{`{
  "to": ["user@example.com"],
  "cc": ["cc@example.com"],
  "email_subject": "Hello",
  "html_content": "<p>Email body</p>"
}`}</code>
                            </pre>
                            <p>Set the property mappings to:</p>
                            <ul className="mb-0">
                              <li>
                                Recipients Property Name: <code>to</code>
                              </li>
                              <li>
                                CC List Property Name: <code>cc</code>
                              </li>
                              <li>
                                Subject Property Name: <code>email_subject</code>
                              </li>
                              <li>
                                HTML Body Property Name: <code>html_content</code>
                              </li>
                            </ul>
                          </div>
                        </details>
                      </div>
                    </div>

                    {/* Headers */}
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label fw-bold mb-0">Custom Headers (Optional)</label>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={handleAddHeader}
                        >
                          + Add Header
                        </button>
                      </div>
                      <div className="form-text mb-3">
                        Add custom HTTP headers to be sent with each request (e.g., Authorization,
                        API-Key)
                      </div>

                      {webhookHeaders.length === 0 ? (
                        <div className="alert alert-secondary">
                          No custom headers configured. Click "Add Header" to add one.
                        </div>
                      ) : (
                        <div className="border rounded p-3">
                          {webhookHeaders.map((header, index) => (
                            <div key={index} className="row g-2 mb-2">
                              <div className="col-5">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={header.key}
                                  onChange={e => handleHeaderChange(index, 'key', e.target.value)}
                                  placeholder="Header Name (e.g., Authorization)"
                                />
                              </div>
                              <div className="col-6">
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={header.value}
                                  onChange={e => handleHeaderChange(index, 'value', e.target.value)}
                                  placeholder="Header Value"
                                />
                              </div>
                              <div className="col-1">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleRemoveHeader(index)}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2">
                      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Saving...
                          </>
                        ) : (
                          'Save Settings'
                        )}
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={handleTestWebhook}
                        disabled={saving || !webhookUrl.trim()}
                      >
                        Test Webhook
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="col-lg-4">
                <div className="settings-card settings-sticky">
                  <div className="settings-card-header">
                    <h6 className="mb-0">Request Preview</h6>
                  </div>
                  <div className="settings-card-body">
                    <p className="small text-muted">This is how the request will be formatted:</p>

                    <div className="mb-3">
                      <strong className="small">URL:</strong>
                      <pre
                        className="bg-light p-2 rounded mt-1 small mb-0"
                        style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}
                      >
                        {webhookUrl || 'Not configured'}
                      </pre>
                    </div>

                    {webhookHeaders.length > 0 && (
                      <div className="mb-3">
                        <strong className="small">Headers:</strong>
                        <pre
                          className="bg-light p-2 rounded mt-1 small mb-0"
                          style={{ fontSize: '0.75rem' }}
                        >
                          {JSON.stringify(
                            Object.fromEntries(
                              webhookHeaders
                                .filter(h => h.key.trim() !== '')
                                .map(h => [h.key, h.value])
                            ),
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}

                    <div>
                      <strong className="small">Body Structure:</strong>
                      <pre
                        className="bg-light p-2 rounded mt-1 small mb-0"
                        style={{ fontSize: '0.75rem', maxHeight: '300px', overflow: 'auto' }}
                      >
                        {JSON.stringify(
                          {
                            [bodyMapping.recipients || 'recipients']: ['email@example.com'],
                            [bodyMapping.ccList || 'ccList']: ['cc@example.com'],
                            [bodyMapping.subject || 'subject']: 'Email subject',
                            [bodyMapping.htmlBody || 'message']: '<p>Email content</p>',
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Supabase Tab */}
          {activeTab === 'supabase' && (
            <div className="row">
              <div className="col-lg-8">
                <div className="settings-card">
                  <div className="settings-card-header">
                    <h5 className="mb-0">Supabase Integration for Pixel Tracking</h5>
                  </div>
                  <div className="settings-card-body">
                    <div className="mb-4">
                      <label className="form-label fw-bold">
                        Supabase URL <span className="text-danger">*</span>
                      </label>
                      <input
                        type="url"
                        className="form-control"
                        value={supabaseUrl}
                        onChange={e => setSupabaseUrl(e.target.value)}
                        placeholder="https://your-project.supabase.co"
                      />
                      <div className="form-text">Your Supabase project URL</div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold">
                        Supabase Anon Key <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        className="form-control font-monospace"
                        value={supabaseKey}
                        onChange={e => setSupabaseKey(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      />
                      <div className="form-text">
                        Your Supabase anon/public key for client-side requests
                      </div>
                    </div>

                    <div className="alert alert-info">
                      <strong>How it works:</strong>
                      <ul className="mb-0 mt-2">
                        <li>
                          The tracking pixel URL is automatically generated as:{' '}
                          <code>{'{supabaseUrl}'}/functions/v1/store-email-interaction</code>
                        </li>
                        <li>
                          The analytics data is fetched from:{' '}
                          <code>{'{supabaseUrl}'}/functions/v1/get-email-interactions</code>
                        </li>
                        <li>
                          When recipients open the email, the pixel sends a request to track the
                          open event
                        </li>
                        <li>
                          Supabase credentials are used to store and retrieve tracking data securely
                        </li>
                      </ul>
                    </div>

                    {/* Action Button */}
                    <div className="d-flex gap-2">
                      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Saving...
                          </>
                        ) : (
                          'Save Settings'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration Preview Panel */}
              <div className="col-lg-4">
                <div className="settings-card settings-sticky">
                  <div className="settings-card-header">
                    <h6 className="mb-0">Configuration Preview</h6>
                  </div>
                  <div className="settings-card-body">
                    <p className="small text-muted">Current Supabase configuration:</p>

                    <div className="mb-3">
                      <strong className="small">Supabase URL:</strong>
                      <pre
                        className="bg-light p-2 rounded mt-1 small mb-0"
                        style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}
                      >
                        {supabaseUrl || 'Not configured'}
                      </pre>
                    </div>

                    <div className="mb-3">
                      <strong className="small">Supabase Key:</strong>
                      <pre
                        className="bg-light p-2 rounded mt-1 small mb-0"
                        style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}
                      >
                        {supabaseKey ? '••••••••••••••••' : 'Not configured'}
                      </pre>
                    </div>

                    {supabaseUrl && (
                      <>
                        <div className="mb-3">
                          <strong className="small">Tracking Pixel URL:</strong>
                          <pre
                            className="bg-light p-2 rounded mt-1 small mb-0"
                            style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}
                          >
                            {`${supabaseUrl}/functions/v1/store-email-interaction`}
                          </pre>
                        </div>

                        <div className="mb-3">
                          <strong className="small">Analytics URL:</strong>
                          <pre
                            className="bg-light p-2 rounded mt-1 small mb-0"
                            style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}
                          >
                            {`${supabaseUrl}/functions/v1/get-email-interactions`}
                          </pre>
                        </div>

                        <div className="mt-3">
                          <strong className="small">Example Pixel:</strong>
                          <pre
                            className="bg-light p-2 rounded mt-1 small mb-0"
                            style={{ fontSize: '0.65rem', wordBreak: 'break-all' }}
                          >
                            {`<img src="${supabaseUrl}/functions/v1/store-email-interaction?campaignId=123&recipient=some@email.com&templateId=abc&emailId=asd" width="1" height="1" />`}
                          </pre>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Import/Export Tab */}
          {activeTab === 'import-export' && (
            <div className="row">
              <div className="col-lg-8">
                <div className="settings-card mb-4">
                  <div className="settings-card-header">
                    <h5 className="mb-0">Export Settings</h5>
                  </div>
                  <div className="settings-card-body">
                    <p className="text-muted">
                      Download all your current settings as a JSON file. This includes:
                    </p>
                    <ul className="text-muted">
                      <li>Webhook configuration (URL, headers, body mapping)</li>
                      <li>Supabase integration settings</li>
                    </ul>
                    <button className="btn btn-primary" onClick={handleExportSettings}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-download me-2"
                        viewBox="0 0 16 16"
                      >
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                      </svg>
                      Download Settings
                    </button>
                  </div>
                </div>

                <div className="settings-card">
                  <div className="settings-card-header">
                    <h5 className="mb-0">Import Settings</h5>
                  </div>
                  <div className="settings-card-body">
                    <p className="text-muted">
                      Upload a previously exported settings JSON file to restore your configuration.
                    </p>
                    <div className="alert alert-warning">
                      <strong>Warning:</strong> Importing settings will overwrite all your current
                      settings. Make sure to export your current settings first if you want to keep
                      a backup.
                    </div>
                    <div className="mb-3">
                      <label htmlFor="import-file" className="form-label">
                        Select Settings File
                      </label>
                      <input
                        id="import-file"
                        type="file"
                        className="form-control"
                        accept=".json,application/json"
                        onChange={handleImportSettings}
                        disabled={importing}
                      />
                    </div>
                    {importing && (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Importing...</span>
                        </div>
                        <span>Importing settings...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Panel */}
              <div className="col-lg-4">
                <div className="settings-card settings-sticky">
                  <div className="settings-card-header">
                    <h6 className="mb-0">About Import/Export</h6>
                  </div>
                  <div className="settings-card-body">
                    <h6 className="small fw-bold">Export</h6>
                    <p className="small text-muted">
                      Creates a JSON file containing all your settings. The file will be named with
                      the current date for easy organization.
                    </p>

                    <h6 className="small fw-bold mt-3">Import</h6>
                    <p className="small text-muted">
                      Restores settings from a previously exported JSON file. The import process
                      validates the file structure to ensure compatibility.
                    </p>

                    <h6 className="small fw-bold mt-3">Use Cases</h6>
                    <ul className="small text-muted mb-0">
                      <li>Backup settings before making changes</li>
                      <li>Transfer settings between different environments</li>
                      <li>Share configuration with team members</li>
                      <li>Quick recovery if settings get misconfigured</li>
                    </ul>

                    <div className="alert alert-info mt-3 small mb-0">
                      <strong>Tip:</strong> Settings are stored in your browser's localStorage.
                      Regular exports help prevent data loss if you clear your browser data.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Others Tab */}
          {activeTab === 'others' && (
            <div className="row">
              <div className="col-lg-8">
                <div className="settings-card">
                  <div className="settings-card-header">
                    <h5 className="mb-0">Other Settings</h5>
                  </div>
                  <div className="settings-card-body">
                    <div className="mb-4">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="pixelTrackingToggle"
                          checked={pixelTrackingEnabled}
                          onChange={e => setPixelTrackingEnabled(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="pixelTrackingToggle">
                          <strong>Enable Pixel Tracking</strong>
                        </label>
                      </div>
                      <div className="form-text mt-2">
                        When enabled, a tracking pixel will be automatically added to all outgoing
                        emails to track open events. Requires Supabase configuration.
                      </div>
                    </div>

                    <div className="alert alert-info">
                      <strong>About Pixel Tracking:</strong>
                      <ul className="mb-0 mt-2">
                        <li>
                          A 1x1 transparent pixel is added to the end of each email's HTML content
                        </li>
                        <li>
                          When recipients open the email, the pixel sends a request to track the
                          open event
                        </li>
                        <li>
                          Tracking data is stored in Supabase and displayed in the Analytics page
                        </li>
                        <li>
                          If disabled, no tracking pixel will be added to emails, and open events
                          will not be tracked
                        </li>
                      </ul>
                    </div>

                    {/* Action Button */}
                    <div className="d-flex gap-2">
                      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Saving...
                          </>
                        ) : (
                          'Save Settings'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Panel */}
              <div className="col-lg-4">
                <div className="settings-card settings-sticky">
                  <div className="settings-card-header">
                    <h6 className="mb-0">Current Status</h6>
                  </div>
                  <div className="settings-card-body">
                    <div className="mb-3">
                      <strong className="small">Pixel Tracking:</strong>
                      <div className="mt-1">
                        {pixelTrackingEnabled ? (
                          <span className="badge bg-success">Enabled</span>
                        ) : (
                          <span className="badge bg-secondary">Disabled</span>
                        )}
                      </div>
                    </div>

                    {pixelTrackingEnabled && (
                      <div className="alert alert-warning small mb-0">
                        <strong>Note:</strong> Pixel tracking requires Supabase to be configured in
                        the Supabase Integration tab. If Supabase is not configured, pixels will not
                        be added even when this setting is enabled.
                      </div>
                    )}

                    {!pixelTrackingEnabled && (
                      <div className="alert alert-info small mb-0">
                        <strong>Privacy Mode:</strong> With pixel tracking disabled, recipients'
                        email open events will not be tracked. This provides better privacy for your
                        recipients.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
