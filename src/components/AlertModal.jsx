import { useAlert } from '../contexts/AlertContext'
import './AlertModal.css'

function AlertModal() {
  const { alertState, handleConfirm, handleCancel } = useAlert()

  if (!alertState.isOpen) return null

  const getIconForType = type => {
    switch (type) {
      case 'success':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            className="text-success"
            viewBox="0 0 16 16"
          >
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
          </svg>
        )
      case 'warning':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            className="text-warning"
            viewBox="0 0 16 16"
          >
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
          </svg>
        )
      case 'danger':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            className="text-danger"
            viewBox="0 0 16 16"
          >
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z" />
          </svg>
        )
      case 'info':
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            className="text-info"
            viewBox="0 0 16 16"
          >
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2" />
          </svg>
        )
    }
  }

  const getButtonClass = type => {
    switch (type) {
      case 'success':
        return 'btn-success'
      case 'warning':
        return 'btn-warning'
      case 'danger':
        return 'btn-danger'
      case 'info':
      default:
        return 'btn-primary'
    }
  }

  const handleBackdropClick = e => {
    if (e.target === e.currentTarget) {
      if (alertState.variant === 'alert') {
        handleConfirm()
      } else {
        handleCancel()
      }
    }
  }

  return (
    <>
      {/* Modal backdrop */}
      <div className="alert-modal-backdrop" onClick={handleBackdropClick}></div>

      {/* Modal */}
      <div className="alert-modal-wrapper" onClick={handleBackdropClick}>
        <div className="alert-modal-content" onClick={e => e.stopPropagation()}>
          <div className="alert-modal-header">
            <button
              type="button"
              className="alert-modal-close"
              onClick={alertState.variant === 'alert' ? handleConfirm : handleCancel}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="alert-modal-body">
            <div className={`alert-modal-icon ${alertState.type}`}>
              {getIconForType(alertState.type)}
            </div>
            {alertState.title && <h4 className="alert-modal-title">{alertState.title}</h4>}
            {alertState.message && <p className="alert-modal-message">{alertState.message}</p>}
          </div>
          <div className="alert-modal-footer">
            {alertState.variant === 'confirm' && (
              <button type="button" className="btn btn-secondary" onClick={handleCancel} autoFocus>
                {alertState.cancelText}
              </button>
            )}
            <button
              type="button"
              className={`btn ${getButtonClass(alertState.type)}`}
              onClick={handleConfirm}
              autoFocus={alertState.variant === 'alert'}
            >
              {alertState.confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default AlertModal
