import { useState, useEffect } from 'react'
import { useAlert } from '../contexts/AlertContext'
import LocalStorageSettingsRepository from '../repositories/LocalStorageSettingsRepository'
import { testWebhook } from '../services/emailService'
import ImportExportTab from './Settings/ImportExportTab'
import OthersTab from './Settings/OthersTab'
import SupabaseTab from './Settings/SupabaseTab'
import WebhookTab from './Settings/WebhookTab'
import './Settings.css'

const settingsRepository = new LocalStorageSettingsRepository()

function Settings() {
  const { showAlert } = useAlert()
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
      showAlert({
        title: 'Error',
        message: 'Failed to load settings',
        type: 'danger',
      })
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
        showAlert({
          title: 'Validation Error',
          message: 'Please enter a webhook URL',
          type: 'warning',
        })
        return
      }

      try {
        new URL(webhookUrl)
      } catch (error) {
        showAlert({
          title: 'Validation Error',
          message: 'Please enter a valid URL',
          type: 'warning',
        })
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
        showAlert({
          title: 'Success',
          message: 'Webhook settings saved successfully!',
          type: 'success',
        })
      } catch (error) {
        console.error('Error saving settings:', error)
        showAlert({
          title: 'Error',
          message: 'Failed to save settings',
          type: 'danger',
        })
      } finally {
        setSaving(false)
      }
    } else if (activeTab === 'supabase') {
      // Validate Supabase settings
      if (!supabaseUrl.trim()) {
        showAlert({
          title: 'Validation Error',
          message: 'Please enter a Supabase URL',
          type: 'warning',
        })
        return
      }

      if (!supabaseKey.trim()) {
        showAlert({
          title: 'Validation Error',
          message: 'Please enter a Supabase key',
          type: 'warning',
        })
        return
      }

      try {
        new URL(supabaseUrl)
      } catch (error) {
        showAlert({
          title: 'Validation Error',
          message: 'Please enter a valid Supabase URL',
          type: 'warning',
        })
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
        showAlert({
          title: 'Success',
          message: 'Supabase settings saved successfully!',
          type: 'success',
        })
      } catch (error) {
        console.error('Error saving settings:', error)
        showAlert({
          title: 'Error',
          message: 'Failed to save settings',
          type: 'danger',
        })
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
        showAlert({
          title: 'Success',
          message: 'Settings saved successfully!',
          type: 'success',
        })
      } catch (error) {
        console.error('Error saving settings:', error)
        showAlert({
          title: 'Error',
          message: 'Failed to save settings',
          type: 'danger',
        })
      } finally {
        setSaving(false)
      }
    }
  }

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      showAlert({
        title: 'Validation Error',
        message: 'Please enter a webhook URL first',
        type: 'warning',
      })
      return
    }

    setSaving(true)
    try {
      const result = await testWebhook(webhookUrl, webhookHeaders, bodyMapping)

      if (result.ok) {
        showAlert({
          title: 'Success',
          message: 'Test webhook sent successfully! Check your webhook endpoint.',
          type: 'success',
        })
      } else {
        showAlert({
          title: 'Warning',
          message: `Webhook test failed with status: ${result.status}`,
          type: 'warning',
        })
      }
    } catch (error) {
      console.error('Error testing webhook:', error)
      showAlert({
        title: 'Error',
        message: `Failed to test webhook: ${error.message}`,
        type: 'danger',
      })
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

      showAlert({
        title: 'Success',
        message: 'Settings exported successfully!',
        type: 'success',
      })
    } catch (error) {
      console.error('Error exporting settings:', error)
      showAlert({
        title: 'Error',
        message: 'Failed to export settings',
        type: 'danger',
      })
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

        showAlert({
          title: 'Success',
          message: 'Settings imported successfully! The page will reload.',
          type: 'success',
        })
        window.location.reload()
      } catch (error) {
        console.error('Error importing settings:', error)
        showAlert({
          title: 'Error',
          message: `Failed to import settings: ${error.message}`,
          type: 'danger',
        })
      } finally {
        setImporting(false)
        // Reset file input
        event.target.value = ''
      }
    }

    reader.onerror = () => {
      showAlert({
        title: 'Error',
        message: 'Failed to read file',
        type: 'danger',
      })
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
            <WebhookTab
              webhookUrl={webhookUrl}
              setWebhookUrl={setWebhookUrl}
              webhookHeaders={webhookHeaders}
              bodyMapping={bodyMapping}
              saving={saving}
              handleAddHeader={handleAddHeader}
              handleRemoveHeader={handleRemoveHeader}
              handleHeaderChange={handleHeaderChange}
              handleBodyMappingChange={handleBodyMappingChange}
              handleSave={handleSave}
              handleTestWebhook={handleTestWebhook}
            />
          )}

          {/* Supabase Tab */}
          {activeTab === 'supabase' && (
            <SupabaseTab
              supabaseUrl={supabaseUrl}
              setSupabaseUrl={setSupabaseUrl}
              supabaseKey={supabaseKey}
              setSupabaseKey={setSupabaseKey}
              saving={saving}
              handleSave={handleSave}
            />
          )}

          {/* Others Tab */}
          {activeTab === 'others' && (
            <OthersTab
              pixelTrackingEnabled={pixelTrackingEnabled}
              setPixelTrackingEnabled={setPixelTrackingEnabled}
              saving={saving}
              handleSave={handleSave}
            />
          )}

          {/* Import/Export Tab */}
          {activeTab === 'import-export' && (
            <ImportExportTab
              importing={importing}
              handleExportSettings={handleExportSettings}
              handleImportSettings={handleImportSettings}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
