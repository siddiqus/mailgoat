function OthersTab({ pixelTrackingEnabled, setPixelTrackingEnabled, saving, handleSave }) {
  return (
    <div className="row">
      <div className="col-lg-8">
        <div className="settings-card">
          <div className="settings-card-header">
            <h5 className="mb-0">Other Settings</h5>
          </div>
          <div className="settings-card-body">
            <div className="mb-4">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="pixelTrackingToggle"
                  checked={pixelTrackingEnabled}
                  onChange={e => setPixelTrackingEnabled(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="pixelTrackingToggle">
                  <strong>Enable Pixel Tracking</strong>
                </label>
              </div>
              <div className="form-text mt-2">
                When enabled, a tracking pixel will be automatically added to all outgoing emails to
                track open events. Requires Supabase configuration.
              </div>
            </div>

            <div className="alert alert-info">
              <strong>About Pixel Tracking:</strong>
              <ul className="mb-0 mt-2">
                <li>
                  A 1x1 transparent pixel is added to the end of each email&apos;s HTML content
                </li>
                <li>
                  When recipients open the email, the pixel sends a request to track the open event
                </li>
                <li>Tracking data is stored in Supabase and displayed in the Analytics page</li>
                <li>
                  If disabled, no tracking pixel will be added to emails, and open events will not
                  be tracked
                </li>
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

      {/* Info Panel */}
      <div className="col-lg-4">
        <div className="settings-card settings-sticky">
          <div className="settings-card-header">
            <h6 className="mb-0">Current Status</h6>
          </div>
          <div className="settings-card-body">
            <div className="mb-3">
              <strong className="small">Pixel Tracking:</strong>
              <div className="mt-1">
                {pixelTrackingEnabled ? (
                  <span className="badge bg-success">Enabled</span>
                ) : (
                  <span className="badge bg-secondary">Disabled</span>
                )}
              </div>
            </div>

            {pixelTrackingEnabled && (
              <div className="alert alert-warning small mb-0">
                <strong>Note:</strong> Pixel tracking requires Supabase to be configured in the
                Supabase Integration tab. If Supabase is not configured, pixels will not be added
                even when this setting is enabled.
              </div>
            )}

            {!pixelTrackingEnabled && (
              <div className="alert alert-info small mb-0">
                <strong>Privacy Mode:</strong> With pixel tracking disabled, recipients&apos; email
                open events will not be tracked. This provides better privacy for your recipients.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OthersTab
