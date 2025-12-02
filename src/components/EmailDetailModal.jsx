import { sanitizeHtml } from '../utils/sanitizer'

function EmailDetailModal({ emailRecord, onClose }) {
  if (!emailRecord) return null

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Email Details</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {/* Email Info */}
            <div className="mb-4">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Sent At:</label>
                  <div className="p-2 bg-light rounded border">
                    {new Date(emailRecord.sentAt).toLocaleString()}
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Template:</label>
                  <div className="p-2 bg-light rounded border">{emailRecord.templateName}</div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Recipients:</label>
                <div className="p-2 bg-light rounded border">
                  {Array.isArray(emailRecord.recipients)
                    ? emailRecord.recipients.join(', ')
                    : emailRecord.recipients}
                </div>
              </div>

              {emailRecord.ccList && emailRecord.ccList.length > 0 && (
                <div className="mb-3">
                  <label className="form-label fw-bold">CC:</label>
                  <div className="p-2 bg-light rounded border">
                    {Array.isArray(emailRecord.ccList)
                      ? emailRecord.ccList.join(', ')
                      : emailRecord.ccList}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-bold">Subject:</label>
                <div className="p-2 bg-light rounded border">{emailRecord.subject}</div>
              </div>

              <div>
                <label className="form-label fw-bold">Email Content:</label>
                <div
                  className="border rounded p-3 bg-white"
                  style={{
                    minHeight: '200px',
                    maxHeight: '500px',
                    overflow: 'auto',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(emailRecord.htmlBody) }}
                />
              </div>
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

export default EmailDetailModal
