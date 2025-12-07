function ImportExportTab({ importing, handleExportSettings, handleImportSettings }) {
  return (
    <div className="row">
      <div className="col-lg-8">
        <div className="settings-card mb-4">
          <div className="settings-card-header">
            <h5 className="mb-0">Export Settings</h5>
          </div>
          <div className="settings-card-body">
            <p className="text-muted">
              Download all your current settings as a JSON file. This includes:
            </p>
            <ul className="text-muted">
              <li>Webhook configuration (URL, headers, body mapping)</li>
              <li>Supabase integration settings</li>
            </ul>
            <button className="btn btn-primary" onClick={handleExportSettings}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-download me-2"
                viewBox="0 0 16 16"
              >
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
              </svg>
              Download Settings
            </button>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <h5 className="mb-0">Import Settings</h5>
          </div>
          <div className="settings-card-body">
            <p className="text-muted">
              Upload a previously exported settings JSON file to restore your configuration.
            </p>
            <div className="alert alert-warning">
              <strong>Warning:</strong> Importing settings will overwrite all your current settings.
              Make sure to export your current settings first if you want to keep a backup.
            </div>
            <div className="mb-3">
              <label htmlFor="import-file" className="form-label">
                Select Settings File
              </label>
              <input
                id="import-file"
                type="file"
                className="form-control"
                accept=".json,application/json"
                onChange={handleImportSettings}
                disabled={importing}
              />
            </div>
            {importing && (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Importing...</span>
                </div>
                <span>Importing settings...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="col-lg-4">
        <div className="settings-card settings-sticky">
          <div className="settings-card-header">
            <h6 className="mb-0">About Import/Export</h6>
          </div>
          <div className="settings-card-body">
            <h6 className="small fw-bold">Export</h6>
            <p className="small text-muted">
              Creates a JSON file containing all your settings. The file will be named with the
              current date for easy organization.
            </p>

            <h6 className="small fw-bold mt-3">Import</h6>
            <p className="small text-muted">
              Restores settings from a previously exported JSON file. The import process validates
              the file structure to ensure compatibility.
            </p>

            <h6 className="small fw-bold mt-3">Use Cases</h6>
            <ul className="small text-muted mb-0">
              <li>Backup settings before making changes</li>
              <li>Transfer settings between different environments</li>
              <li>Share configuration with team members</li>
              <li>Quick recovery if settings get misconfigured</li>
            </ul>

            <div className="alert alert-info mt-3 small mb-0">
              <strong>Tip:</strong> Settings are stored in your browser&apos;s localStorage. Regular
              exports help prevent data loss if you clear your browser data.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportExportTab
