import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import EmailDetailModal from '../components/EmailDetailModal'
import PageCard from '../components/PageCard'
import PageContainer from '../components/PageContainer'
import SearchableSelect from '../components/SearchableSelect'
import TemplateDetailModal from '../components/TemplateDetailModal'
import { useAlert } from '../contexts/AlertContext'
import { getAllCampaigns } from '../services/campaignService'
import { getAllHistory, clearAllHistory } from '../services/emailHistoryService'
import { getTemplateById, getAllTemplates } from '../services/templateRepositoryService'

function History() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { showAlert, showConfirm } = useAlert()
  const [history, setHistory] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState('all')
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState('all')

  // Initialize filters from URL query parameters
  useEffect(() => {
    const campaignParam = searchParams.get('campaign')
    const templateParam = searchParams.get('template')

    if (campaignParam) {
      setSelectedCampaignFilter(campaignParam)
    }
    if (templateParam) {
      setSelectedTemplateFilter(templateParam)
    }
  }, [searchParams])

  useEffect(() => {
    loadHistory()
    loadCampaigns()
    loadTemplates()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await getAllHistory()
      setHistory(data)
    } catch (error) {
      console.error('Error loading email history:', error)
      showAlert({
        title: 'Error',
        message: 'Failed to load email history',
        type: 'danger',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const data = await getAllHistory()
      setHistory(data)
    } catch (error) {
      console.error('Error refreshing email history:', error)
      showAlert({
        title: 'Error',
        message: 'Failed to refresh email history',
        type: 'danger',
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleClearHistory = async () => {
    const confirmed = await showConfirm({
      title: 'Clear Email History',
      message: 'Are you sure you want to clear all email history? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Clear History',
      cancelText: 'Cancel',
    })

    if (!confirmed) return

    setLoading(true)
    try {
      await clearAllHistory()
      setHistory([])
      showAlert({
        title: 'Success',
        message: 'Email history cleared successfully!',
        type: 'success',
      })
    } catch (error) {
      console.error('Error clearing email history:', error)
      showAlert({
        title: 'Error',
        message: 'Failed to clear email history',
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

  const loadTemplates = async () => {
    try {
      const data = await getAllTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleTemplateClick = async templateId => {
    try {
      const template = await getTemplateById(templateId)
      if (template) {
        setSelectedTemplate(template)
      } else {
        showAlert({
          title: 'Template Not Found',
          message: 'Template not found. It may have been deleted.',
          type: 'warning',
        })
      }
    } catch (error) {
      console.error('Error loading template:', error)
      showAlert({
        title: 'Error',
        message: 'Failed to load template details',
        type: 'danger',
      })
    }
  }

  const formatRecipients = recipients => {
    if (Array.isArray(recipients)) {
      return recipients.length > 2
        ? `${recipients.slice(0, 2).join(', ')} +${recipients.length - 2} more`
        : recipients.join(', ')
    }
    return recipients
  }

  const getCampaign = campaignId => {
    if (!campaignId) return null
    const campaign = campaigns.find(c => c.id === campaignId)
    return campaign || { name: 'Unknown Campaign', color: '#6c757d' }
  }

  // Helper function to determine if text should be light or dark based on background
  const getTextColor = hexColor => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16)
    const g = parseInt(hexColor.slice(3, 5), 16)
    const b = parseInt(hexColor.slice(5, 7), 16)
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  // Update URL when filters change
  const handleCampaignFilterChange = value => {
    setSelectedCampaignFilter(value)
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
      params.delete('campaign')
    } else {
      params.set('campaign', value)
    }
    setSearchParams(params)
  }

  const handleTemplateFilterChange = value => {
    setSelectedTemplateFilter(value)
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
      params.delete('template')
    } else {
      params.set('template', value)
    }
    setSearchParams(params)
  }

  const handleClearFilters = () => {
    setSelectedCampaignFilter('all')
    setSelectedTemplateFilter('all')
    setSearchParams({})
  }

  // Build campaign options for searchable select
  const campaignOptions = useMemo(() => {
    const options = [
      { value: 'all', label: 'All Campaigns' },
      { value: 'none', label: 'No Campaign' },
    ]
    campaigns.forEach(campaign => {
      options.push({
        value: campaign.id,
        label: campaign.name,
      })
    })
    return options
  }, [campaigns])

  // Build template options for searchable select
  const templateOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All Templates' }]
    templates.forEach(template => {
      options.push({
        value: template.id,
        label: template.name,
      })
    })
    return options
  }, [templates])

  // Filter history based on selected campaign and template
  const filteredHistory = useMemo(() => {
    let filtered = history

    // Apply campaign filter
    if (selectedCampaignFilter === 'none') {
      filtered = filtered.filter(record => !record.campaignId)
    } else if (selectedCampaignFilter !== 'all') {
      filtered = filtered.filter(record => record.campaignId === selectedCampaignFilter)
    }

    // Apply template filter
    if (selectedTemplateFilter !== 'all') {
      filtered = filtered.filter(record => record.templateId === selectedTemplateFilter)
    }

    return filtered
  }, [history, selectedCampaignFilter, selectedTemplateFilter])

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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Email History</h2>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-danger"
            onClick={handleClearHistory}
            disabled={loading || refreshing || history.length === 0}
            title="Clear all email history"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-trash me-2"
              viewBox="0 0 16 16"
            >
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
            </svg>
            Clear History
          </button>
          <button
            className="btn btn-primary"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh email history"
          >
            {refreshing ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Refreshing...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-arrow-clockwise me-2"
                  viewBox="0 0 16 16"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"
                  />
                  <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="alert alert-info">
          No emails sent yet. Sent emails will appear here in your history.
        </div>
      ) : (
        <div>
          {/* Filters */}
          <PageCard className="mb-3">
            <div className="row g-3">
              {/* Campaign Filter */}
              <div className="col-md-6">
                <div className="d-flex align-items-end gap-2">
                  <div style={{ flex: 1 }}>
                    <SearchableSelect
                      label="Filter by Campaign:"
                      options={campaignOptions}
                      value={selectedCampaignFilter}
                      onChange={handleCampaignFilterChange}
                      placeholder="Select a campaign..."
                      allowClear={true}
                    />
                  </div>
                  {selectedCampaignFilter !== 'all' && selectedCampaignFilter !== 'none' && (
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        backgroundColor:
                          campaigns.find(c => c.id === selectedCampaignFilter)?.color || '#0d6efd',
                        borderRadius: '4px',
                        border: '1px solid #dee2e6',
                        flexShrink: 0,
                      }}
                      title={campaigns.find(c => c.id === selectedCampaignFilter)?.name}
                    />
                  )}
                </div>
              </div>

              {/* Template Filter */}
              <div className="col-md-6">
                <SearchableSelect
                  label="Filter by Template:"
                  options={templateOptions}
                  value={selectedTemplateFilter}
                  onChange={handleTemplateFilterChange}
                  placeholder="Select a template..."
                  allowClear={true}
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {(selectedCampaignFilter !== 'all' || selectedTemplateFilter !== 'all') && (
              <div className="mt-3">
                <button className="btn btn-sm btn-outline-secondary" onClick={handleClearFilters}>
                  Clear All Filters
                </button>
              </div>
            )}
          </PageCard>

          <PageCard className="p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}>Sent At</th>
                    <th style={{ width: '8%' }}>Status</th>
                    <th style={{ width: '12%' }}>Template</th>
                    <th style={{ width: '12%' }}>Campaign</th>
                    <th style={{ width: '18%' }}>Recipients</th>
                    <th style={{ width: '12%' }}>CC</th>
                    <th style={{ width: '18%' }}>Subject</th>
                    <th style={{ width: '8%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map(record => (
                    <tr key={record.id}>
                      <td className="align-middle">
                        <small>{new Date(record.sentAt).toLocaleString()}</small>
                      </td>
                      <td className="align-middle">
                        {record.status === 'pending' && (
                          <span className="badge bg-warning text-dark">Pending</span>
                        )}
                        {record.status === 'sent' && <span className="badge bg-success">Sent</span>}
                        {record.status === 'failed' && (
                          <span className="badge bg-danger">Failed</span>
                        )}
                      </td>
                      <td className="align-middle">
                        {record.templateId ? (
                          <button
                            className="btn btn-sm btn-link p-0 text-start"
                            onClick={() => handleTemplateClick(record.templateId)}
                            title="View template details"
                          >
                            {record.templateName}
                          </button>
                        ) : (
                          <span className="text-muted">{record.templateName}</span>
                        )}
                      </td>
                      <td className="align-middle">
                        {record.campaignId ? (
                          (() => {
                            const campaign = getCampaign(record.campaignId)
                            const bgColor = campaign.color || '#0d6efd'
                            const textColor = getTextColor(bgColor)
                            return (
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: bgColor,
                                  color: textColor,
                                }}
                              >
                                {campaign.name}
                              </span>
                            )
                          })()
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="align-middle">
                        <small>{formatRecipients(record.recipients)}</small>
                      </td>
                      <td className="align-middle">
                        <small>
                          {record.ccList && record.ccList.length > 0
                            ? formatRecipients(record.ccList)
                            : '-'}
                        </small>
                      </td>
                      <td className="align-middle">
                        <small>{record.subject}</small>
                      </td>
                      <td className="align-middle">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setSelectedEmail(record)}
                          title="View email"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PageCard>

          <div className="text-muted mt-2">
            <small>
              Showing {filteredHistory.length} of {history.length} email
              {history.length !== 1 ? 's' : ''}{' '}
            </small>
          </div>
        </div>
      )}

      {/* Email Detail Modal */}
      {selectedEmail && (
        <EmailDetailModal emailRecord={selectedEmail} onClose={() => setSelectedEmail(null)} />
      )}

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </PageContainer>
  )
}

export default History
