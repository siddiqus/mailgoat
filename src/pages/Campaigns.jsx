import { useState, useEffect } from 'react'
import PageCard from '../components/PageCard'
import PageContainer from '../components/PageContainer'
import { getAllCampaigns, createCampaign, updateCampaign } from '../services/campaignService'

function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' or 'edit'
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [campaignName, setCampaignName] = useState('')
  const [campaignColor, setCampaignColor] = useState('#0d6efd')
  const [saving, setSaving] = useState(false)

  // Predefined color palette
  const colorPalette = [
    '#0d6efd', // Blue
    '#6610f2', // Indigo
    '#6f42c1', // Purple
    '#d63384', // Pink
    '#dc3545', // Red
    '#fd7e14', // Orange
    '#ffc107', // Yellow
    '#198754', // Green
    '#20c997', // Teal
    '#0dcaf0', // Cyan
    '#17a2b8', // Info
    '#6c757d', // Gray
    '#343a40', // Dark Gray
    '#f8f9fa', // Light Gray
    '#e83e8c', // Hot Pink
    '#ff6b6b', // Coral Red
    '#4ecdc4', // Turquoise
    '#95e1d3', // Mint
    '#f38181', // Salmon
    '#aa96da', // Lavender
    '#fcbad3', // Light Pink
    '#ffffd2', // Light Yellow
    '#a8e6cf', // Pale Green
    '#ffd3b6', // Peach
    '#ffaaa5', // Light Coral
    '#ff8b94', // Rose
    '#9e9e9e', // Medium Gray
    '#795548', // Brown
    '#607d8b', // Blue Gray
    '#8e44ad', // Deep Purple
  ]

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const data = await getAllCampaigns()
      setCampaigns(data)
    } catch (error) {
      console.error('Error loading campaigns:', error)
      alert('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreateModal = () => {
    setModalMode('create')
    setEditingCampaign(null)
    setCampaignName('')
    setCampaignColor('#0d6efd')
    setShowModal(true)
  }

  const handleOpenEditModal = campaign => {
    setModalMode('edit')
    setEditingCampaign(campaign)
    setCampaignName(campaign.name)
    setCampaignColor(campaign.color || '#0d6efd')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCampaign(null)
    setCampaignName('')
    setCampaignColor('#0d6efd')
  }

  const handleSaveCampaign = async e => {
    e.preventDefault()

    if (!campaignName.trim()) {
      alert('Please enter a campaign name')
      return
    }

    setSaving(true)
    try {
      if (modalMode === 'create') {
        await createCampaign(campaignName, campaignColor)
      } else {
        await updateCampaign(editingCampaign.id, {
          name: campaignName.trim(),
          color: campaignColor,
        })
      }
      handleCloseModal()
      await loadCampaigns()
    } catch (error) {
      console.error('Error saving campaign:', error)
      alert(`Failed to save campaign: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = dateString => {
    const date = new Date(dateString)
    return date.toLocaleString()
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Campaigns</h2>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          Create Campaign
        </button>
      </div>

      {/* Campaigns List */}
      <PageCard className="p-0">
        {campaigns.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              fill="currentColor"
              className="bi bi-folder-x mb-3"
              viewBox="0 0 16 16"
            >
              <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181L15.546 8H14.54l.265-2.91A1 1 0 0 0 13.81 4H9.828a2 2 0 0 1-1.414-.586l-.828-.828A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006 3.089H.54z" />
              <path d="M5 12.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
              <path d="M0 4.5A1.5 1.5 0 0 1 1.5 3h13A1.5 1.5 0 0 1 16 4.5v7a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 11.5v-7zM1 6v5.5a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5V6H1z" />
            </svg>
            <p className="mb-0">No campaigns yet. Create your first campaign above!</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>Color</th>
                  <th style={{ width: '30%' }}>Campaign Name</th>
                  <th style={{ width: '15%' }}>Emails Sent</th>
                  <th style={{ width: '25%' }}>Created</th>
                  <th style={{ width: '25%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(campaign => (
                  <tr key={campaign.id}>
                    <td className="align-middle">
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: campaign.color || '#0d6efd',
                          borderRadius: '4px',
                          border: '1px solid #dee2e6',
                        }}
                        title={campaign.color}
                      />
                    </td>
                    <td className="align-middle">{campaign.name}</td>
                    <td className="align-middle">
                      <span className="badge bg-primary">{campaign.emailCount || 0}</span>
                    </td>
                    <td className="align-middle text-muted small">
                      {formatDate(campaign.createdAt)}
                    </td>
                    <td className="align-middle">
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleOpenEditModal(campaign)}
                        title="Edit campaign"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>

      <div className="alert alert-info mt-4">
        <strong>About Campaigns:</strong> Campaigns help you organize and track your email sends.
        Each email you send can be associated with a campaign, making it easier to analyze
        performance and group related emails together.
      </div>

      {/* Campaign Modal */}
      {showModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalMode === 'create' ? 'Create Campaign' : 'Edit Campaign'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  disabled={saving}
                ></button>
              </div>
              <form onSubmit={handleSaveCampaign}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="campaignName" className="form-label">
                      Campaign Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="campaignName"
                      value={campaignName}
                      onChange={e => setCampaignName(e.target.value)}
                      placeholder="e.g., Summer Sale 2024, Newsletter Q1"
                      disabled={saving}
                      autoFocus
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Color</label>
                    <div className="d-flex gap-2 flex-wrap">
                      {colorPalette.map(color => (
                        <button
                          key={color}
                          type="button"
                          className={`btn p-0 border ${campaignColor === color ? 'border-dark border-3' : 'border-secondary'}`}
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: color,
                            borderRadius: '4px',
                          }}
                          onClick={() => setCampaignColor(color)}
                          title={color}
                          disabled={saving}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Saving...
                      </>
                    ) : modalMode === 'create' ? (
                      'Create Campaign'
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}

export default Campaigns
