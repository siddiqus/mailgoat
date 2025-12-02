import { sanitizeHtml } from '../utils/sanitizer'

function TemplateDetailModal({ template, onClose }) {
  if (!template) return null

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Template Details - {template.name}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label fw-bold">Template Name:</label>
              <div className="p-2 bg-light rounded border">{template.name}</div>
            </div>

            {template.subject && (
              <div className="mb-3">
                <label className="form-label fw-bold">Subject Template:</label>
                <div className="p-2 bg-light rounded border">{template.subject}</div>
              </div>
            )}

            {template.parameters && template.parameters.length > 0 && (
              <div className="mb-3">
                <label className="form-label fw-bold">Parameters:</label>
                <div className="p-2 bg-light rounded border">
                  <div className="d-flex flex-wrap gap-2">
                    {template.parameters.map((param, index) => (
                      <span key={index} className="badge bg-secondary">
                        {param}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="form-label fw-bold">HTML Template:</label>
              <div
                className="border rounded p-3 bg-white"
                style={{
                  minHeight: '200px',
                  maxHeight: '400px',
                  overflow: 'auto',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(template.htmlString) }}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplateDetailModal
