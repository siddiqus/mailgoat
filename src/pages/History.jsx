import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import CalendarInviteDetailModal from '../components/CalendarInviteDetailModal'
import EmailDetailModal from '../components/EmailDetailModal'
import PageCard from '../components/PageCard'
import PageContainer from '../components/PageContainer'
import SearchableSelect from '../components/SearchableSelect'
import TemplateDetailModal from '../components/TemplateDetailModal'
import Tabs from '../components/ui/Tabs'
import { useAlert } from '../contexts/AlertContext'
import {
  getAllCalendarInviteHistory,
  clearAllCalendarInviteHistory,
} from '../services/calendarInviteHistoryService'
import { getAllCampaigns } from '../services/campaignService'
import { getAllHistory, clearAllHistory } from '../services/emailHistoryService'
import { getTemplateById, getAllTemplates } from '../services/templateRepositoryService'

function History() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { showAlert, showConfirm } = useAlert()
  const [history, setHistory] = useState([])
  const [calendarHistory, setCalendarHistory] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [selectedCalendarInvite, setSelectedCalendarInvite] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState('all')
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState('all')
  const [selectedCalendarTemplateFilter, setSelectedCalendarTemplateFilter] = useState('all')
  const [emailPage, setEmailPage] = useState(1)

  const [currentTab, setCurrentTab] = useState('emails')

  const [calendarPage, setCalendarPage] = useState(1)
  const itemsPerPage = 10

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
    loadCalendarHistory()
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

  const loadCalendarHistory = async () => {
    try {
      const data = getAllCalendarInviteHistory()
      setCalendarHistory(data)
    } catch (error) {
      console.error('Error loading calendar invite history:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const data = await getAllHistory()
      setHistory(data)
      const calData = getAllCalendarInviteHistory()
      setCalendarHistory(calData)
    } catch (error) {
      console.error('Error refreshing history:', error)
      showAlert({
        title: 'Error',
        message: 'Failed to refresh history',
        type: 'danger',
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleClearHistory = async () => {
    const confirmed = await showConfirm({
      title: `Clear ${currentTab} History`,
      message: 'Are you sure you want to clear all email history? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Clear History',
      cancelText: 'Cancel',
    })

    if (!confirmed) return

    setLoading(true)
    try {
      if (currentTab === 'emails') {
        await clearAllHistory()
        setHistory([])
      } else {
        await clearAllCalendarInviteHistory()
        setCalendarHistory([])
      }
      showAlert({
        title: 'Success',
        message: `${currentTab === 'emails' ? 'Email' : 'Calendar'} invite history cleared successfully!`,
        type: 'success',
      })
    } catch (error) {
      console.error(`Error clearing ${currentTab} history:`, error)
      showAlert({
        title: 'Error',
        message: `Failed to clear ${currentTab} history`,
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
    setEmailPage(1) // Reset to first page when filter changes
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
    setEmailPage(1) // Reset to first page when filter changes
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
    setEmailPage(1) // Reset to first page
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

  // Build calendar template options for searchable select
  const calendarTemplateOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All Templates' }]
    templates
      .filter(template => template.type === 'calendar')
      .forEach(template => {
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

  // Filter calendar history based on selected template
  const filteredCalendarHistory = useMemo(() => {
    let filtered = calendarHistory

    // Apply template filter
    if (selectedCalendarTemplateFilter !== 'all') {
      filtered = filtered.filter(record => record.templateId === selectedCalendarTemplateFilter)
    }

    return filtered
  }, [calendarHistory, selectedCalendarTemplateFilter])

  // Calculate status counts for emails
  const emailStatusCounts = useMemo(() => {
    const counts = { pending: 0, sent: 0, failed: 0 }
    filteredHistory.forEach(record => {
      if (record.status in counts) {
        counts[record.status]++
      }
    })
    return counts
  }, [filteredHistory])

  // Calculate status counts for calendar invites (they're all sent)
  const calendarStatusCounts = useMemo(() => {
    return { sent: filteredCalendarHistory.length }
  }, [filteredCalendarHistory])

  // Paginate email history
  const paginatedEmailHistory = useMemo(() => {
    const startIndex = (emailPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredHistory.slice(startIndex, endIndex)
  }, [filteredHistory, emailPage, itemsPerPage])

  // Paginate calendar history
  const paginatedCalendarHistory = useMemo(() => {
    const startIndex = (calendarPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredCalendarHistory.slice(startIndex, endIndex)
  }, [filteredCalendarHistory, calendarPage, itemsPerPage])

  // Calculate total pages
  const totalEmailPages = Math.ceil(filteredHistory.length / itemsPerPage)
  const totalCalendarPages = Math.ceil(filteredCalendarHistory.length / itemsPerPage)

  // Pagination control component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null

    const getPageNumbers = () => {
      const pages = []
      const maxPagesToShow = 5

      if (totalPages <= maxPagesToShow) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, '...', totalPages)
        } else if (currentPage >= totalPages - 2) {
          pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
        } else {
          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
        }
      }

      return pages
    }

    return (
      <nav aria-label="Page navigation" className="mt-3">
        <ul className="pagination justify-content-center mb-0">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
          </li>

          {getPageNumbers().map((page, index) =>
            page === '...' ? (
              <li key={`ellipsis-${index}`} className="page-item disabled">
                <span className="page-link">...</span>
              </li>
            ) : (
              <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                <button className="page-link" onClick={() => onPageChange(page)}>
                  {page}
                </button>
              </li>
            )
          )}

          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    )
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
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2>History</h2>
        <div className="d-flex justify-content-end align-items-center mb-3 gap-2">
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

      <Tabs defaultTab="emails" onChange={tab => setCurrentTab(tab)}>
        <Tabs.Tab value="emails" label="Emails">
          {history.length === 0 ? (
            <div className="alert alert-info">
              No emails sent yet. Sent emails will appear here in your history.
            </div>
          ) : (
            <div>
              {/* Filters */}
              <PageCard className="mb-3">
                <div className="d-flex align-items-center gap-2">
                  {/* Campaign Filter */}
                  <div style={{ flex: 1 }}>
                    <SearchableSelect
                      options={campaignOptions}
                      value={selectedCampaignFilter}
                      onChange={handleCampaignFilterChange}
                      placeholder="Filter by campaign..."
                      allowClear={true}
                    />
                  </div>

                  {/* Template Filter */}
                  <div style={{ flex: 1 }}>
                    <SearchableSelect
                      options={templateOptions}
                      value={selectedTemplateFilter}
                      onChange={handleTemplateFilterChange}
                      placeholder="Filter by template..."
                      allowClear={true}
                    />
                  </div>

                  {/* Clear Filters Button */}
                  {(selectedCampaignFilter !== 'all' || selectedTemplateFilter !== 'all') && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={handleClearFilters}
                      style={{ flexShrink: 0 }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </PageCard>
              <div className="mb-3">
                {/* Status Summary */}
                <div className="d-flex gap-3">
                  <span
                    className="badge bg-success"
                    style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                  >
                    Sent: {emailStatusCounts.sent}
                  </span>
                  <span
                    className="badge bg-warning text-dark"
                    style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                  >
                    Pending: {emailStatusCounts.pending}
                  </span>
                  <span
                    className="badge bg-danger"
                    style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                  >
                    Failed: {emailStatusCounts.failed}
                  </span>
                </div>
              </div>
              <PageCard className="p-0">
                <div className="table-responsive" style={{ height: '400px' }}>
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
                      {paginatedEmailHistory.map(record => (
                        <tr key={record.id}>
                          <td className="align-middle">
                            <small>{new Date(record.sentAt).toLocaleString()}</small>
                          </td>
                          <td className="align-middle">
                            {record.status === 'pending' && (
                              <span className="badge bg-warning text-dark">Pending</span>
                            )}
                            {record.status === 'sent' && (
                              <span className="badge bg-success">Sent</span>
                            )}
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

              <Pagination
                currentPage={emailPage}
                totalPages={totalEmailPages}
                onPageChange={setEmailPage}
              />

              <div className="text-muted mt-2">
                <small>
                  Showing{' '}
                  {paginatedEmailHistory.length === 0 ? 0 : (emailPage - 1) * itemsPerPage + 1}
                  {paginatedEmailHistory.length > 0 &&
                    ` - ${Math.min(emailPage * itemsPerPage, filteredHistory.length)}`}{' '}
                  of {filteredHistory.length} filtered email
                  {filteredHistory.length !== 1 ? 's' : ''} ({history.length} total)
                </small>
              </div>
            </div>
          )}
        </Tabs.Tab>

        <Tabs.Tab value="calendar" label="Calendar Invites">
          {calendarHistory.length === 0 ? (
            <div className="alert alert-info">
              No calendar invites sent yet. Sent calendar invites will appear here in your history.
            </div>
          ) : (
            <div>
              {/* Filters */}
              <PageCard className="mb-3">
                <div className="d-flex align-items-center gap-2 mb-3">
                  {/* Template Filter */}
                  <div style={{ flex: 1 }}>
                    <SearchableSelect
                      options={calendarTemplateOptions}
                      value={selectedCalendarTemplateFilter}
                      onChange={value => {
                        setSelectedCalendarTemplateFilter(value)
                        setCalendarPage(1) // Reset to first page when filter changes
                      }}
                      placeholder="Filter by template..."
                      allowClear={true}
                    />
                  </div>

                  {/* Clear Filters Button */}
                  {selectedCalendarTemplateFilter !== 'all' && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setSelectedCalendarTemplateFilter('all')
                        setCalendarPage(1) // Reset to first page
                      }}
                      style={{ flexShrink: 0 }}
                    >
                      Clear Filter
                    </button>
                  )}
                </div>

                {/* Status Summary */}
                <div className="d-flex gap-3">
                  <span
                    className="badge bg-success"
                    style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                  >
                    Sent: {calendarStatusCounts.sent}
                  </span>
                </div>
              </PageCard>

              <PageCard className="p-0">
                <div className="table-responsive" style={{ height: '400px' }}>
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: '12%' }}>Sent At</th>
                        <th style={{ width: '12%' }}>Template</th>
                        <th style={{ width: '18%' }}>Recipient</th>
                        <th style={{ width: '29%' }}>Subject</th>
                        <th style={{ width: '15%' }}>Time</th>
                        <th style={{ width: '8%' }}>Timezone</th>
                        <th style={{ width: '6%' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCalendarHistory.map(record => (
                        <tr key={record.id}>
                          <td className="align-middle">
                            <small>{new Date(record.sentAt).toLocaleString()}</small>
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
                            <small>{record.recipient}</small>
                          </td>
                          <td className="align-middle">
                            <small>{record.subject}</small>
                          </td>
                          <td className="align-middle">
                            <div>Date: {record.startTime.split('T')[0]}</div>
                            <div>
                              From: {new Date(record.startTime).toLocaleString().split(',')[1]}
                            </div>
                            <div>To: {new Date(record.endTime).toLocaleString().split(',')[1]}</div>
                          </td>
                          <td className="align-middle">
                            <small>{record.timezone}</small>
                          </td>
                          <td className="align-middle">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => setSelectedCalendarInvite(record)}
                              title="View calendar invite"
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

              <Pagination
                currentPage={calendarPage}
                totalPages={totalCalendarPages}
                onPageChange={setCalendarPage}
              />

              <div className="text-muted mt-2">
                <small>
                  Showing{' '}
                  {paginatedCalendarHistory.length === 0
                    ? 0
                    : (calendarPage - 1) * itemsPerPage + 1}
                  {paginatedCalendarHistory.length > 0 &&
                    ` - ${Math.min(calendarPage * itemsPerPage, filteredCalendarHistory.length)}`}{' '}
                  of {filteredCalendarHistory.length} filtered calendar invite
                  {filteredCalendarHistory.length !== 1 ? 's' : ''} ({calendarHistory.length} total)
                </small>
              </div>
            </div>
          )}
        </Tabs.Tab>
      </Tabs>

      {/* Email Detail Modal */}
      {selectedEmail && (
        <EmailDetailModal emailRecord={selectedEmail} onClose={() => setSelectedEmail(null)} />
      )}

      {/* Calendar Invite Detail Modal */}
      {selectedCalendarInvite && (
        <CalendarInviteDetailModal
          inviteRecord={selectedCalendarInvite}
          onClose={() => setSelectedCalendarInvite(null)}
        />
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
