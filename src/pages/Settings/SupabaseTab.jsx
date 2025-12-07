function SupabaseTab({
  supabaseUrl,
  setSupabaseUrl,
  supabaseKey,
  setSupabaseKey,
  saving,
  handleSave,
}) {
  return (
    <div className="row">
      <div className="col-lg-8">
        <div className="settings-card">
          <div className="settings-card-header">
            <h5 className="mb-0">Supabase Integration for Pixel Tracking</h5>
          </div>
          <div className="settings-card-body">
            <div className="mb-4">
              <label className="form-label fw-bold">
                Supabase URL <span className="text-danger">*</span>
              </label>
              <input
                type="url"
                className="form-control"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
              />
              <div className="form-text">Your Supabase project URL</div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold">
                Supabase Anon Key <span className="text-danger">*</span>
              </label>
              <input
                type="password"
                className="form-control font-monospace"
                value={supabaseKey}
                onChange={e => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              />
              <div className="form-text">
                Your Supabase anon/public key for client-side requests
              </div>
            </div>

            <div className="alert alert-info">
              <strong>How it works:</strong>
              <ul className="mb-0 mt-2">
                <li>
                  The tracking pixel URL is automatically generated as:{' '}
                  <code>{'{supabaseUrl}'}/functions/v1/store-email-interaction</code>
                </li>
                <li>
                  The analytics data is fetched from:{' '}
                  <code>{'{supabaseUrl}'}/functions/v1/get-email-interactions</code>
                </li>
                <li>
                  When recipients open the email, the pixel sends a request to track the open event
                </li>
                <li>Supabase credentials are used to store and retrieve tracking data securely</li>
              </ul>
            </div>

            {/* Action Button */}
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
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Preview Panel */}
      <div className="col-lg-4">
        <div className="settings-card settings-sticky">
          <div className="settings-card-header">
            <h6 className="mb-0">Configuration Preview</h6>
          </div>
          <div className="settings-card-body">
            <p className="small text-muted">Current Supabase configuration:</p>

            <div className="mb-3">
              <strong className="small">Supabase URL:</strong>
              <pre
                className="bg-light p-2 rounded mt-1 small mb-0"
                style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}
              >
                {supabaseUrl || 'Not configured'}
              </pre>
            </div>

            <div className="mb-3">
              <strong className="small">Supabase Key:</strong>
              <pre
                className="bg-light p-2 rounded mt-1 small mb-0"
                style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}
              >
                {supabaseKey ? '••••••••••••••••' : 'Not configured'}
              </pre>
            </div>

            {supabaseUrl && (
              <>
                <div className="mb-3">
                  <strong className="small">Tracking Pixel URL:</strong>
                  <pre
                    className="bg-light p-2 rounded mt-1 small mb-0"
                    style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}
                  >
                    {`${supabaseUrl}/functions/v1/store-email-interaction`}
                  </pre>
                </div>

                <div className="mb-3">
                  <strong className="small">Analytics URL:</strong>
                  <pre
                    className="bg-light p-2 rounded mt-1 small mb-0"
                    style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}
                  >
                    {`${supabaseUrl}/functions/v1/get-email-interactions`}
                  </pre>
                </div>

                <div className="mt-3">
                  <strong className="small">Example Pixel:</strong>
                  <pre
                    className="bg-light p-2 rounded mt-1 small mb-0"
                    style={{ fontSize: '0.65rem', wordBreak: 'break-all' }}
                  >
                    {`<img src="${supabaseUrl}/functions/v1/store-email-interaction?campaignId=123&recipient=some@email.com&templateId=abc&emailId=asd" width="1" height="1" />`}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupabaseTab
