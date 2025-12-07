import { createContext, useState, useContext, useCallback } from 'react'
import PropTypes from 'prop-types'

const AlertContext = createContext(null)

export function AlertProvider({ children }) {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'info', 'success', 'warning', 'danger'
    variant: 'alert', // 'alert', 'confirm'
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null,
  })

  const showAlert = useCallback(
    ({ title, message, type = 'info', confirmText = 'OK', onConfirm }) => {
      return new Promise(resolve => {
        setAlertState({
          isOpen: true,
          title,
          message,
          type,
          variant: 'alert',
          confirmText,
          cancelText: '',
          onConfirm: () => {
            resolve(true)
            onConfirm?.()
          },
          onCancel: null,
        })
      })
    },
    []
  )

  const showConfirm = useCallback(
    ({
      title,
      message,
      type = 'warning',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      onConfirm,
      onCancel,
    }) => {
      return new Promise(resolve => {
        setAlertState({
          isOpen: true,
          title,
          message,
          type,
          variant: 'confirm',
          confirmText,
          cancelText,
          onConfirm: () => {
            resolve(true)
            onConfirm?.()
          },
          onCancel: () => {
            resolve(false)
            onCancel?.()
          },
        })
      })
    },
    []
  )

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }))
  }, [])

  const handleConfirm = useCallback(() => {
    alertState.onConfirm?.()
    closeAlert()
  }, [alertState, closeAlert])

  const handleCancel = useCallback(() => {
    alertState.onCancel?.()
    closeAlert()
  }, [alertState, closeAlert])

  const value = {
    alertState,
    showAlert,
    showConfirm,
    closeAlert,
    handleConfirm,
    handleCancel,
  }

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>
}

AlertProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export function useAlert() {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider')
  }
  return context
}
