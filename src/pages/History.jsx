import { useEffect, useState } from 'react'
import EmailDetailModal from '../components/EmailDetailModal'
import TemplateDetailModal from '../components/TemplateDetailModal'
import { getAllHistory } from '../services/emailHistoryService'
import { getTemplateById } from '../services/templateRepositoryService'

function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await getAllHistory()
      setHistory(data)
    } catch (error) {
      console.error('Error loading email history:', error)
      alert('Failed to load email history')
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateClick = async templateId => {
    try {
      const template = await getTemplateById(templateId)
      if (template) {
        setSelectedTemplate(template)
      } else {
        alert('Template not found. It may have been deleted.')
      }
    } catch (error) {
      console.error('Error loading template:', error)
      alert('Failed to load template details')
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
        <h2>Email History</h2>
      </div>

      {history.length === 0 ? (
        <div className="alert alert-info">
          No emails sent yet. Sent emails will appear here in your history.
        </div>
      ) : (
        <div>
          <div
            className="border rounded"
            style={{
              height: 'calc(100vh - 250px)',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
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
                    <th style={{ width: '150px' }}>Template</th>
                    <th>Recipients</th>
                    <th>CC</th>
                    <th>Subject</th>
                    <th style={{ width: '200px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(record => (
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
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => setSelectedEmail(record)}
                            title="View email"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-muted mt-2">
            <small>Total: {history.length} email(s) sent</small>
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
    </div>
  )
}

export default History
