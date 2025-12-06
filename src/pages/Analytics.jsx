import { useEffect, useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import EmailDetailModal from '../components/EmailDetailModal'
import PageCard from '../components/PageCard'
import PageContainer from '../components/PageContainer'
import SearchableSelect from '../components/SearchableSelect'
import { getEmailAnalytics } from '../services/analyticsService'
import { getAllCampaigns } from '../services/campaignService'
import { getAllHistory } from '../services/emailHistoryService'
import { getAllTemplates } from '../services/templateRepositoryService'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function Analytics() {
  const [campaigns, setCampaigns] = useState([])
  const [templates, setTemplates] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchingAnalytics, setFetchingAnalytics] = useState(false)

  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState('all')
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState('all')
  const [chartStackMode, setChartStackMode] = useState('templates') // 'templates' or 'campaigns'
  const [analyticsData, setAnalyticsData] = useState(null)
  const [selectedEmail, setSelectedEmail] = useState(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [campaignsData, templatesData, historyData] = await Promise.all([
        getAllCampaigns(),
        getAllTemplates(),
        getAllHistory(),
      ])
      setCampaigns(campaignsData)
      setTemplates(templatesData)
      setHistory(historyData)
    } catch (error) {
      console.error('Error loading initial data:', error)
      alert('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleViewAnalytics = async () => {
    // Validate that at least one filter is selected
    if (selectedCampaignFilter === 'all' && selectedTemplateFilter === 'all') {
      alert('Please select at least one campaign or template to view analytics')
      return
    }

    setFetchingAnalytics(true)
    try {
      // Prepare parameters
      const params = {}
      if (selectedCampaignFilter !== 'all') {
        params.campaignId = selectedCampaignFilter
      }
      if (selectedTemplateFilter !== 'all') {
        params.templateId = selectedTemplateFilter
      }

      // Fetch analytics using the service
      const result = await getEmailAnalytics(params)
      setAnalyticsData(result)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      alert(`Failed to fetch analytics: ${error.message}`)
    } finally {
      setFetchingAnalytics(false)
    }
  }

  const handleClearFilters = () => {
    setSelectedCampaignFilter('all')
    setSelectedTemplateFilter('all')
    setAnalyticsData(null)
  }

  // Build campaign options for searchable select
  const campaignOptions = useMemo(() => {
    const options = []
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
    const options = []
    templates.forEach(template => {
      options.push({
        value: template.id,
        label: template.name,
      })
    })
    return options
  }, [templates])

  // Filter history based on selected filters
  const filteredHistory = useMemo(() => {
    if (!analyticsData) return []

    let filtered = history

    // Apply campaign filter
    if (selectedCampaignFilter !== 'all') {
      filtered = filtered.filter(record => record.campaignId === selectedCampaignFilter)
    }

    // Apply template filter
    if (selectedTemplateFilter !== 'all') {
      filtered = filtered.filter(record => record.templateId === selectedTemplateFilter)
    }

    return filtered
  }, [history, selectedCampaignFilter, selectedTemplateFilter, analyticsData])

  // Get opened email IDs from analytics data
  const openedEmailIds = useMemo(() => {
    if (!analyticsData?.data) return new Set()
    return new Set(analyticsData.data.map(interaction => interaction.email_id))
  }, [analyticsData])

  // Filter opened emails
  const openedEmails = useMemo(() => {
    if (!analyticsData) return []
    return filteredHistory.filter(record => openedEmailIds.has(record.emailId))
  }, [filteredHistory, openedEmailIds, analyticsData])

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!analyticsData || filteredHistory.length === 0) return null

    if (chartStackMode === 'templates') {
      // Group by template
      const templateMap = new Map()

      filteredHistory.forEach(record => {
        const templateId = record.templateId || 'no-template'
        const templateName = record.templateName || 'No Template'

        if (!templateMap.has(templateId)) {
          templateMap.set(templateId, {
            name: templateName,
            sent: 0,
            opened: 0,
          })
        }

        const stats = templateMap.get(templateId)
        stats.sent++
        if (openedEmailIds.has(record.emailId)) {
          stats.opened++
        }
      })

      const labels = Array.from(templateMap.values()).map(t => t.name)
      const sentData = Array.from(templateMap.values()).map(t => t.sent)
      const openedData = Array.from(templateMap.values()).map(t => t.opened)

      return {
        labels,
        datasets: [
          {
            label: 'Sent',
            data: sentData,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            label: 'Opened',
            data: openedData,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      }
    } else {
      // Group by campaign
      const campaignMap = new Map()

      filteredHistory.forEach(record => {
        const campaignId = record.campaignId || 'no-campaign'
        const campaign = campaigns.find(c => c.id === campaignId)
        const campaignName = campaign?.name || 'No Campaign'

        if (!campaignMap.has(campaignId)) {
          campaignMap.set(campaignId, {
            name: campaignName,
            sent: 0,
            opened: 0,
          })
        }

        const stats = campaignMap.get(campaignId)
        stats.sent++
        if (openedEmailIds.has(record.emailId)) {
          stats.opened++
        }
      })

      const labels = Array.from(campaignMap.values()).map(c => c.name)
      const sentData = Array.from(campaignMap.values()).map(c => c.sent)
      const openedData = Array.from(campaignMap.values()).map(c => c.opened)

      return {
        labels,
        datasets: [
          {
            label: 'Sent',
            data: sentData,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
          },
          {
            label: 'Opened',
            data: openedData,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      }
    }
  }, [analyticsData, filteredHistory, openedEmailIds, chartStackMode, campaigns])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Email Analytics - Grouped by ${chartStackMode === 'templates' ? 'Templates' : 'Campaigns'}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  const formatRecipients = recipients => {
    if (Array.isArray(recipients)) {
      return recipients.length > 2
        ? `${recipients.slice(0, 2).join(', ')} +${recipients.length - 2} more`
        : recipients.join(', ')
    }
    return recipients
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
      <h2 className="mb-4">Email Analytics</h2>

      {/* Filters */}
      <PageCard className="mb-4">
        <div className="row g-3 align-items-end">
          {/* Campaign Filter */}
          <div className="col-md-4">
            <SearchableSelect
              label="Filter by Campaign:"
              options={campaignOptions}
              value={selectedCampaignFilter}
              onChange={setSelectedCampaignFilter}
              placeholder="Select a campaign..."
              allowClear={true}
            />
          </div>

          {/* Template Filter */}
          <div className="col-md-4">
            <SearchableSelect
              label="Filter by Template:"
              options={templateOptions}
              value={selectedTemplateFilter}
              onChange={setSelectedTemplateFilter}
              placeholder="Select a template..."
              allowClear={true}
            />
          </div>

          {/* Action Buttons */}
          <div className="col-md-4">
            <div className="d-flex gap-2 align-items-center">
              <button
                className="btn btn-primary"
                onClick={handleViewAnalytics}
                disabled={
                  fetchingAnalytics ||
                  (selectedCampaignFilter === 'all' && selectedTemplateFilter === 'all')
                }
              >
                {fetchingAnalytics ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Loading...
                  </>
                ) : (
                  'View Analytics'
                )}
              </button>
              {(selectedCampaignFilter !== 'all' || selectedTemplateFilter !== 'all') && (
                <button className="btn btn-outline-secondary" onClick={handleClearFilters}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </PageCard>

      {/* Analytics Results */}
      {analyticsData && (
        <>
          {/* Summary Stats */}
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <h5 className="card-title">Total Sent</h5>
                  <h2 className="mb-0">{filteredHistory.length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <h5 className="card-title">Total Opened</h5>
                  <h2 className="mb-0">{openedEmails.length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <h5 className="card-title">Open Rate</h5>
                  <h2 className="mb-0">
                    {filteredHistory.length > 0
                      ? `${((openedEmails.length / filteredHistory.length) * 100).toFixed(1)}%`
                      : '0%'}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <PageCard
            className="mb-4"
            header="Email Performance Chart"
            headerActions={
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${chartStackMode === 'templates' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setChartStackMode('templates')}
                >
                  By Templates
                </button>
                <button
                  type="button"
                  className={`btn ${chartStackMode === 'campaigns' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setChartStackMode('campaigns')}
                >
                  By Campaigns
                </button>
              </div>
            }
          >
            {chartData && (
              <div style={{ height: '400px' }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
            )}
          </PageCard>

          {/* Opened Emails List */}
          <PageCard header={`Opened Emails (${openedEmails.length})`}>
            {openedEmails.length === 0 ? (
              <div className="alert alert-info">
                No emails have been opened yet for the selected filters.
              </div>
            ) : (
              <div
                className="border rounded"
                style={{
                  height: '400px',
                  overflow: 'auto',
                }}
              >
                <table className="table table-hover mb-0">
                  <thead
                    className="table-light"
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    <tr>
                      <th style={{ width: '180px' }}>Sent At</th>
                      <th>Recipient</th>
                      <th>Subject</th>
                      <th>CC</th>
                      <th style={{ width: '100px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openedEmails.map(record => (
                      <tr key={record.id}>
                        <td className="align-middle">
                          <small>{new Date(record.sentAt).toLocaleString()}</small>
                        </td>
                        <td className="align-middle">
                          <small>{formatRecipients(record.recipients)}</small>
                        </td>
                        <td className="align-middle">
                          <small>{record.subject}</small>
                        </td>
                        <td className="align-middle">
                          <small>
                            {record.ccList && record.ccList.length > 0
                              ? formatRecipients(record.ccList)
                              : '-'}
                          </small>
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
            )}
          </PageCard>
        </>
      )}

      {/* Email Detail Modal */}
      {selectedEmail && (
        <EmailDetailModal emailRecord={selectedEmail} onClose={() => setSelectedEmail(null)} />
      )}
    </PageContainer>
  )
}

export default Analytics
