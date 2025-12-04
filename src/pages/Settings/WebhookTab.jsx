import Card from '../../components/ui/Card'

function WebhookTab({
  webhookUrl,
  setWebhookUrl,
  webhookHeaders,
  bodyMapping,
  saving,
  handleAddHeader,
  handleRemoveHeader,
  handleHeaderChange,
  handleBodyMappingChange,
  handleSave,
  handleTestWebhook,
}) {
  return (
    <div className="row">
      <div className="col-lg-8">
        <Card>
          <Card.Header>
            <h5 className="mb-0">Webhook Configuration</h5>
          </Card.Header>
          <Card.Body>
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
                Configure the property names that will be sent in the webhook request body. Enter
                the desired property name for each email field.
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
                    onChange={e => handleBodyMappingChange('htmlBody', e.target.value)}
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
                      The property mapping allows you to customize the JSON property names sent to
                      your webhook.
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
                Add custom HTTP headers to be sent with each request (e.g., Authorization, API-Key)
              </div>

              {webhookHeaders.length === 0 ? (
                <div className="alert alert-secondary">
                  No custom headers configured. Click &quot;Add Header&quot; to add one.
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
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}

export default WebhookTab
