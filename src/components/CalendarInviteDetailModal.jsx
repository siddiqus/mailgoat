import { sanitizeHtml } from '../utils/sanitizer'
import { formatDateTimeWithDay } from '../utils/timeUtils'

function CalendarInviteDetailModal({ inviteRecord, onClose }) {
  if (!inviteRecord) return null

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Calendar Invite Details</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {/* Calendar Invite Info */}
            <div className="mb-4">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Sent At:</label>
                  <div className="p-2 bg-light rounded border">
                    {new Date(inviteRecord.sentAt).toLocaleString()}
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Template:</label>
                  <div className="p-2 bg-light rounded border">{inviteRecord.templateName}</div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Recipient:</label>
                <div className="p-2 bg-light rounded border">{inviteRecord.recipient}</div>
              </div>

              {inviteRecord.cc && inviteRecord.cc.trim() && (
                <div className="mb-3">
                  <label className="form-label fw-bold">CC:</label>
                  <div className="p-2 bg-light rounded border">{inviteRecord.cc}</div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-bold">Subject:</label>
                <div className="p-2 bg-light rounded border">{inviteRecord.subject}</div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Start Time:</label>
                  <div className="p-2 bg-light rounded border">
                    {formatDateTimeWithDay(inviteRecord.startTime)}
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">End Time:</label>
                  <div className="p-2 bg-light rounded border">
                    {formatDateTimeWithDay(inviteRecord.endTime)}
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Timezone:</label>
                  <div className="p-2 bg-light rounded border">{inviteRecord.timezone}</div>
                </div>
                {inviteRecord.attachmentName && (
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Attachment:</label>
                    <div className="p-2 bg-light rounded border">{inviteRecord.attachmentName}</div>
                  </div>
                )}
              </div>

              <div>
                <label className="form-label fw-bold">Message Content:</label>
                <div
                  className="border rounded p-3 bg-white"
                  style={{
                    minHeight: '200px',
                    maxHeight: '500px',
                    overflow: 'auto',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(inviteRecord.message) }}
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

export default CalendarInviteDetailModal
