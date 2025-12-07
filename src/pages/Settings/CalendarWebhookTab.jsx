import PropTypes from 'prop-types'

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
    <div className="settings-tab-content">
      <div className="settings-card">
        <div className="settings-card-header">
          <h5 className="mb-0">Calendar Webhook Configuration</h5>
        </div>
        <div className="settings-card-body">
          <div className="settings-section">
            <h5>Webhook URL</h5>
            <div className="mb-3">
              <label htmlFor="calendarWebhookUrl" className="form-label">
                Calendar Webhook URL <span className="text-danger">*</span>
              </label>
              <input
                type="url"
                id="calendarWebhookUrl"
                className="form-control"
                value={calendarWebhookUrl}
                onChange={e => setCalendarWebhookUrl(e.target.value)}
                placeholder="https://your-webhook-endpoint.com/calendar-invite"
              />
              <div className="form-text">
                The endpoint that will receive calendar invite requests
              </div>
            </div>
          </div>
          <hr />
          <div className="settings-section">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Custom Headers</h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={handleAddCalendarHeader}
              >
                + Add Header
              </button>
            </div>

            {calendarWebhookHeaders.length === 0 ? (
              <div className="text-muted">No custom headers configured</div>
            ) : (
              <div className="headers-list">
                {calendarWebhookHeaders.map((header, index) => (
                  <div key={index} className="header-row mb-2">
                    <div className="row g-2">
                      <div className="col-md-5">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Header name (e.g., Authorization)"
                          value={header.key}
                          onChange={e => handleCalendarHeaderChange(index, 'key', e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Header value"
                          value={header.value}
                          onChange={e => handleCalendarHeaderChange(index, 'value', e.target.value)}
                        />
                      </div>
                      <div className="col-md-1">
                        <button
                          type="button"
                          className="btn btn-outline-danger w-100"
                          onClick={() => handleRemoveCalendarHeader(index)}
                          title="Remove header"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="form-text mt-2">
              Add custom headers to include with your calendar webhook requests (e.g., API keys,
              authentication tokens)
            </div>
          </div>
          <hr />
          <div className="settings-section">
            <h5>Request Body Format</h5>
            <div className="alert alert-info">
              <h6>The calendar webhook will send the following JSON structure:</h6>
              <pre className="mb-0" style={{ fontSize: '0.85em' }}>
                {`{
  "subject": "Meeting Title",
  "to": "recipient@example.com",
  "message": "HTML message body",
  "startTime": "2025-12-08T16:00:00.000Z",
  "endTime": "2025-12-08T17:00:00.000Z",
  "timezone": "Eastern Standard Time",
  "attachmentName": "optional-file.pdf",
  "attachment": "base64-encoded-pdf-content"
}`}
              </pre>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || !calendarWebhookUrl.trim()}
            >
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
                'Save Calendar Webhook Settings'
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleTestCalendarWebhook}
              disabled={saving || !calendarWebhookUrl.trim()}
            >
              Test Calendar Webhook
            </button>
          </div>
        </div>
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
