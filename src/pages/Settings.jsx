import { useState, useEffect } from 'react'
import LocalStorageSettingsRepository from '../repositories/LocalStorageSettingsRepository'
import { testWebhook } from '../services/emailService'

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
      <h2 className="mb-4">Settings</h2>

      {/* Tabs Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'webhook' ? 'active' : ''}`}
            onClick={() => setActiveTab('webhook')}
          >
            Email Webhook
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'supabase' ? 'active' : ''}`}
            onClick={() => setActiveTab('supabase')}
          >
            Supabase Integration
          </button>
        </li>
      </ul>

      {/* Webhook Tab */}
      {activeTab === 'webhook' && (
        <div className="row">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Webhook Configuration</h5>
              </div>
              <div className="card-body">
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
                          The property mapping allows you to customize the JSON property names sent
                          to your webhook.
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
            <div className="card sticky-top" style={{ top: '20px' }}>
              <div className="card-header">
                <h6 className="mb-0">Request Preview</h6>
              </div>
              <div className="card-body">
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
                          webhookHeaders.filter(h => h.key.trim() !== '').map(h => [h.key, h.value])
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
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Supabase Integration for Pixel Tracking</h5>
              </div>
              <div className="card-body">
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
                      When recipients open the email, the pixel sends a request to track the open
                      event
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
            <div className="card sticky-top" style={{ top: '20px' }}>
              <div className="card-header">
                <h6 className="mb-0">Configuration Preview</h6>
              </div>
              <div className="card-body">
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
    </div>
  )
}

export default Settings
