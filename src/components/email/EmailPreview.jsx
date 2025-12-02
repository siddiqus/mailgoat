import { sanitizeHtml } from '../../utils/sanitizer'

function EmailPreview({ subject, htmlBody }) {
  return (
    <div className="card sticky-top" style={{ top: '20px' }}>
      <div className="card-header">
        <h5 className="mb-0">Email Preview</h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label className="form-label fw-bold">Subject:</label>
          <div className="p-2 bg-light rounded border">
            {subject || <span className="text-muted">No subject</span>}
          </div>
        </div>

        <div>
          <label className="form-label fw-bold">HTML Preview:</label>
          <div
            className="border rounded p-3 bg-white"
            style={{
              minHeight: '300px',
              maxHeight: '500px',
              overflow: 'auto',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlBody) }}
          />
        </div>
      </div>
    </div>
  )
}

export default EmailPreview
