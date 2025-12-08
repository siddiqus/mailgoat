import { useMemo } from 'react'
import PageCard from '../../components/PageCard'
import RichTextEditor from '../../components/RichTextEditor'
import SearchableSelect from '../../components/SearchableSelect'
import { sanitizeHtml } from '../../utils/sanitizer'
import { getTimezoneOptions } from '../../utils/timezoneUtils'

function OthersTab({
  pixelTrackingEnabled,
  setPixelTrackingEnabled,
  defaultTimezone,
  setDefaultTimezone,
  signature,
  setSignature,
  saving,
  handleSave,
}) {
  const timezoneOptions = useMemo(() => getTimezoneOptions(), [])

  return (
    <div className="row">
      <div className="col-lg-8">
        <PageCard className="mb-4">
          <label className="form-label">
            <strong>Default Timezone</strong>
          </label>
          <SearchableSelect
            options={timezoneOptions}
            value={defaultTimezone}
            onChange={value => setDefaultTimezone(value)}
            placeholder="Select default timezone"
            allowClear={false}
          />
          <div className="form-text mt-2">
            This timezone will be used by default when creating calendar invites. You can change it
            for individual invites.
          </div>
        </PageCard>
        <PageCard className="mb-4">
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
        </PageCard>

        <PageCard className="mb-4">
          <label className="form-label">
            <strong>Email Signature</strong>
          </label>
          <RichTextEditor value={signature} onChange={setSignature} />
          <div className="form-text mt-2">
            This signature can be optionally appended to your emails and calendar invitations.
            You&apos;ll have the option to include it when sending.
          </div>
        </PageCard>

        {/* Save Button */}
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

      {/* Info Panel */}
      <div className="col-lg-4">
        <div className="settings-card settings-sticky">
          <div className="settings-card-header">
            <h6 className="mb-0">Current Status</h6>
          </div>
          <div className="settings-card-body">
            <div className="mb-3">
              <strong className="small">Default Timezone:</strong>
              <div className="mt-1">
                <small className="text-muted">{defaultTimezone}</small>
              </div>
            </div>

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

            <div className="mb-3">
              <strong className="small">Signature:</strong>
              <div className="mt-1">
                {signature && signature.trim() ? (
                  <>
                    <span className="badge bg-success mb-2">Configured</span>
                    <div
                      className="border rounded p-2 bg-white"
                      style={{
                        maxHeight: '150px',
                        overflow: 'auto',
                        fontSize: '0.85rem',
                      }}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(signature) }}
                    />
                  </>
                ) : (
                  <span className="badge bg-secondary">Not configured</span>
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
