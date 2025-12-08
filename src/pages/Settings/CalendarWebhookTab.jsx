import PropTypes from 'prop-types'
import Card from '../../components/ui/Card'

function CalendarWebhookTab({
  calendarWebhookUrl,
  setCalendarWebhookUrl,
  calendarWebhookHeaders,
  saving,
  handleAddCalendarHeader,
  handleRemoveCalendarHeader,
  handleCalendarHeaderChange,
  handleSave,
  handleTestCalendarWebhook,
}) {
  return (
    <div className="row">
      <div className="col-lg-8">
        <Card>
          <Card.Header>
            <h5 className="mb-0">Calendar Webhook Configuration</h5>
          </Card.Header>
          <Card.Body>
            {/* Webhook URL */}
            <div className="mb-4">
              <label className="form-label fw-bold">
                Calendar Webhook URL <span className="text-danger">*</span>
              </label>
              <input
                type="url"
                className="form-control"
                value={calendarWebhookUrl}
                onChange={e => setCalendarWebhookUrl(e.target.value)}
                placeholder="https://api.example.com/send-calendar-invite"
              />
              <div className="form-text">
                Enter the endpoint URL where calendar invite requests will be sent
              </div>
            </div>

            {/* Headers */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label fw-bold mb-0">Custom Headers (Optional)</label>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={handleAddCalendarHeader}
                >
                  + Add Header
                </button>
              </div>
              <div className="form-text mb-3">
                Add custom HTTP headers to be sent with each request (e.g., Authorization, API-Key)
              </div>

              {calendarWebhookHeaders.length === 0 ? (
                <div className="alert alert-secondary">
                  No custom headers configured. Click &quot;Add Header&quot; to add one.
                </div>
              ) : (
                <div className="border rounded p-3">
                  {calendarWebhookHeaders.map((header, index) => (
                    <div key={index} className="row g-2 mb-2">
                      <div className="col-5">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={header.key}
                          onChange={e => handleCalendarHeaderChange(index, 'key', e.target.value)}
                          placeholder="Header Name (e.g., Authorization)"
                        />
                      </div>
                      <div className="col-6">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={header.value}
                          onChange={e => handleCalendarHeaderChange(index, 'value', e.target.value)}
                          placeholder="Header Value"
                        />
                      </div>
                      <div className="col-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemoveCalendarHeader(index)}
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
                onClick={handleTestCalendarWebhook}
                disabled={saving || !calendarWebhookUrl.trim()}
              >
                Test Calendar Webhook
              </button>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Preview Panel */}
      <div className="col-lg-4">
        <Card className="sticky">
          <Card.Header>
            <h6 className="mb-0">Request Preview</h6>
          </Card.Header>
          <Card.Body>
            <p className="small text-muted">This is how the request will be formatted:</p>

            <div className="mb-3">
              <strong className="small">URL:</strong>
              <pre
                className="bg-light p-2 rounded mt-1 small mb-0"
                style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}
              >
                {calendarWebhookUrl || 'Not configured'}
              </pre>
            </div>

            {calendarWebhookHeaders.length > 0 && (
              <div className="mb-3">
                <strong className="small">Headers:</strong>
                <pre
                  className="bg-light p-2 rounded mt-1 small mb-0"
                  style={{ fontSize: '0.75rem' }}
                >
                  {JSON.stringify(
                    Object.fromEntries(
                      calendarWebhookHeaders
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
                    subject: 'Meeting Title',
                    to: 'recipient@example.com',
                    message: '<p>HTML message body</p>',
                    startTime: '2025-12-08T16:00:00.000Z',
                    endTime: '2025-12-08T17:00:00.000Z',
                    timezone: 'Eastern Standard Time',
                    attachments: [
                      {
                        name: 'optional-file.pdf',
                        fileBase64: 'base64-encoded-pdf-content',
                      },
                    ],
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}

CalendarWebhookTab.propTypes = {
  calendarWebhookUrl: PropTypes.string.isRequired,
  setCalendarWebhookUrl: PropTypes.func.isRequired,
  calendarWebhookHeaders: PropTypes.array.isRequired,
  saving: PropTypes.bool.isRequired,
  handleAddCalendarHeader: PropTypes.func.isRequired,
  handleRemoveCalendarHeader: PropTypes.func.isRequired,
  handleCalendarHeaderChange: PropTypes.func.isRequired,
  handleSave: PropTypes.func.isRequired,
  handleTestCalendarWebhook: PropTypes.func.isRequired,
}

export default CalendarWebhookTab
