import { sanitizeHtml } from '../utils/sanitizer'

function TemplateViewModal({ show, onHide, template }) {
  if (!show || !template) return null

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">View Template</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label fw-bold">Template Name</label>
              <div className="form-control-plaintext border rounded p-2 bg-light">
                {template.name}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Subject</label>
              <div className="form-control-plaintext border rounded p-2 bg-light">
                {template.subject}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Email Preview</label>
              <div
                className="border rounded p-3 bg-white"
                style={{
                  minHeight: '200px',
                  maxHeight: '400px',
                  overflow: 'auto',
                  wordBreak: 'break-word',
                }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(template.htmlString) }}
              />
            </div>

            {template.parameters && template.parameters.length > 0 && (
              <div className="mb-3">
                <label className="form-label fw-bold">Parameters</label>
                <div className="border rounded p-3 bg-light">
                  <div className="d-flex flex-wrap gap-2">
                    {template.parameters.map((param, index) => (
                      <span key={index} className="badge bg-secondary fs-6">
                        {param}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Template ID</label>
                <div className="form-control-plaintext border rounded p-2 bg-light">
                  {template.id}
                </div>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Created</label>
                <div className="form-control-plaintext border rounded p-2 bg-light">
                  {new Date(template.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Last Updated</label>
              <div className="form-control-plaintext border rounded p-2 bg-light">
                {new Date(template.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplateViewModal
