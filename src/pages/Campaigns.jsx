import { useState, useEffect } from 'react'
import {
  getAllCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from '../services/campaignService'

function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [newCampaignColor, setNewCampaignColor] = useState('#0d6efd')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingColor, setEditingColor] = useState('')
  const [creating, setCreating] = useState(false)

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

  const handleCreateCampaign = async e => {
    e.preventDefault()

    if (!newCampaignName.trim()) {
      alert('Please enter a campaign name')
      return
    }

    setCreating(true)
    try {
      await createCampaign(newCampaignName, newCampaignColor)
      setNewCampaignName('')
      setNewCampaignColor('#0d6efd')
      await loadCampaigns()
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert(`Failed to create campaign: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  const handleStartEdit = campaign => {
    setEditingId(campaign.id)
    setEditingName(campaign.name)
    setEditingColor(campaign.color || '#0d6efd')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
    setEditingColor('')
  }

  const handleSaveEdit = async id => {
    if (!editingName.trim()) {
      alert('Campaign name cannot be empty')
      return
    }

    try {
      await updateCampaign(id, { name: editingName.trim(), color: editingColor })
      setEditingId(null)
      setEditingName('')
      setEditingColor('')
      await loadCampaigns()
    } catch (error) {
      console.error('Error updating campaign:', error)
      alert('Failed to update campaign')
    }
  }

  const handleDelete = async id => {
    const campaign = campaigns.find(c => c.id === id)
    if (!campaign) return

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the campaign "${campaign.name}"?\n\nNote: This will not delete the emails associated with this campaign.`
    )

    if (!confirmDelete) return

    try {
      await deleteCampaign(id)
      await loadCampaigns()
    } catch (error) {
      console.error('Error deleting campaign:', error)
      alert('Failed to delete campaign')
    }
  }

  const formatDate = dateString => {
    const date = new Date(dateString)
    return date.toLocaleString()
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Campaigns</h2>
      </div>

      {/* Create New Campaign */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Create New Campaign</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleCreateCampaign}>
            <div className="row g-3 align-items-end">
              <div className="col-md-5">
                <label htmlFor="campaignName" className="form-label">
                  Campaign Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="campaignName"
                  value={newCampaignName}
                  onChange={e => setNewCampaignName(e.target.value)}
                  placeholder="e.g., Summer Sale 2024, Newsletter Q1"
                  disabled={creating}
                />
              </div>
              <div className="col-md-5">
                <label className="form-label">Color</label>
                <div className="d-flex gap-2 flex-wrap">
                  {colorPalette.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`btn p-0 border ${newCampaignColor === color ? 'border-dark border-3' : 'border-secondary'}`}
                      style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: color,
                        borderRadius: '4px',
                      }}
                      onClick={() => setNewCampaignColor(color)}
                      title={color}
                      disabled={creating}
                    />
                  ))}
                </div>
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn btn-primary w-100" disabled={creating}>
                  {creating ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Creating...
                    </>
                  ) : (
                    'Create Campaign'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">All Campaigns ({campaigns.length})</h5>
        </div>
        <div className="card-body p-0">
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
                <thead className="table-light">
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
                        {editingId === campaign.id ? (
                          <div className="d-flex gap-1 flex-wrap">
                            {colorPalette.map(color => (
                              <button
                                key={color}
                                type="button"
                                className={`btn p-0 border ${editingColor === color ? 'border-dark border-2' : 'border-secondary'}`}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  backgroundColor: color,
                                  borderRadius: '4px',
                                }}
                                onClick={() => setEditingColor(color)}
                                title={color}
                              />
                            ))}
                          </div>
                        ) : (
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
                        )}
                      </td>
                      <td className="align-middle">
                        {editingId === campaign.id ? (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            autoFocus
                          />
                        ) : (
                          <strong>{campaign.name}</strong>
                        )}
                      </td>
                      <td className="align-middle">
                        <span className="badge bg-primary">{campaign.emailCount || 0}</span>
                      </td>
                      <td className="align-middle text-muted small">
                        {formatDate(campaign.createdAt)}
                      </td>
                      <td className="align-middle">
                        {editingId === campaign.id ? (
                          <>
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleSaveEdit(campaign.id)}
                            >
                              Save
                            </button>
                            <button className="btn btn-sm btn-secondary" onClick={handleCancelEdit}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => handleStartEdit(campaign)}
                              title="Edit campaign name"
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(campaign.id)}
                              title="Delete campaign"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="alert alert-info mt-4">
        <strong>About Campaigns:</strong> Campaigns help you organize and track your email sends.
        Each email you send can be associated with a campaign, making it easier to analyze
        performance and group related emails together.
      </div>
    </div>
  )
}

export default Campaigns
