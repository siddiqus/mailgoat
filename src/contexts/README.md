# Alert System Usage Guide

This application provides a global alert/confirm modal system that replaces browser's native `alert()` and `confirm()` dialogs with a more user-friendly and customizable modal interface.

## Features

- **Global State Management**: Uses React Context to manage alert state
- **Promise-based API**: Works seamlessly with async/await
- **Multiple Types**: Supports info, success, warning, and danger alerts
- **Two Variants**: Alert (single action) and Confirm (dual action)
- **Customizable**: Configurable button text and messages
- **Accessible**: Keyboard navigation and proper ARIA attributes

## Basic Usage

### Import the Hook

```javascript
import { useAlert } from '../contexts/AlertContext'
```

### Get Alert Functions

```javascript
function MyComponent() {
  const { showAlert, showConfirm } = useAlert()

  // Your component code
}
```

## Alert (Single Action)

Use `showAlert` for informational messages that require acknowledgment:

```javascript
// Simple info alert
showAlert({
  title: 'Information',
  message: 'This is an informational message',
  type: 'info', // 'info' | 'success' | 'warning' | 'danger'
})

// Success message
showAlert({
  title: 'Success',
  message: 'Operation completed successfully!',
  type: 'success',
})

// Error message
showAlert({
  title: 'Error',
  message: 'Something went wrong',
  type: 'danger',
})

// Warning message
showAlert({
  title: 'Warning',
  message: 'Please review your input',
  type: 'warning',
})

// Custom button text
showAlert({
  title: 'Done',
  message: 'All tasks completed',
  type: 'success',
  confirmText: 'Got it!',
})
```

## Confirm (Dual Action)

Use `showConfirm` for actions that require user confirmation:

```javascript
// Basic confirm
const handleDelete = async () => {
  const confirmed = await showConfirm({
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    type: 'danger',
    confirmText: 'Delete',
    cancelText: 'Cancel',
  })

  if (confirmed) {
    // User clicked "Delete"
    await deleteItem()
  }
  // User clicked "Cancel" or closed the modal
}

// Async/await pattern
const handleAction = async () => {
  const proceed = await showConfirm({
    title: 'Confirm Action',
    message: 'Do you want to proceed with this action?',
    type: 'warning',
  })

  if (proceed) {
    // Perform action
  }
}
```

## Parameters

### showAlert Options

| Parameter     | Type                                         | Default | Description                        |
| ------------- | -------------------------------------------- | ------- | ---------------------------------- |
| `title`       | string                                       | -       | Alert title (optional)             |
| `message`     | string                                       | -       | Alert message                      |
| `type`        | 'info' \| 'success' \| 'warning' \| 'danger' | 'info'  | Alert type                         |
| `confirmText` | string                                       | 'OK'    | Button text                        |
| `onConfirm`   | function                                     | -       | Callback when confirmed (optional) |

### showConfirm Options

| Parameter     | Type                                         | Default   | Description                        |
| ------------- | -------------------------------------------- | --------- | ---------------------------------- |
| `title`       | string                                       | -         | Confirm dialog title (optional)    |
| `message`     | string                                       | -         | Confirm dialog message             |
| `type`        | 'info' \| 'success' \| 'warning' \| 'danger' | 'warning' | Dialog type                        |
| `confirmText` | string                                       | 'Confirm' | Confirm button text                |
| `cancelText`  | string                                       | 'Cancel'  | Cancel button text                 |
| `onConfirm`   | function                                     | -         | Callback when confirmed (optional) |
| `onCancel`    | function                                     | -         | Callback when cancelled (optional) |

## Complete Example

```javascript
import { useState } from 'react'
import { useAlert } from '../contexts/AlertContext'

function MyComponent() {
  const { showAlert, showConfirm } = useAlert()
  const [items, setItems] = useState([])

  const handleSave = async () => {
    try {
      await saveData()
      showAlert({
        title: 'Success',
        message: 'Data saved successfully!',
        type: 'success',
      })
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to save data',
        type: 'danger',
      })
    }
  }

  const handleClearAll = async () => {
    const confirmed = await showConfirm({
      title: 'Clear All Data',
      message: 'This will delete all items. Are you sure?',
      type: 'danger',
      confirmText: 'Clear All',
      cancelText: 'Keep Data',
    })

    if (confirmed) {
      setItems([])
      showAlert({
        title: 'Cleared',
        message: 'All items have been removed',
        type: 'info',
      })
    }
  }

  return (
    <div>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleClearAll}>Clear All</button>
    </div>
  )
}
```

## Migration from Native Alerts

**Before:**

```javascript
alert('Operation completed!')
```

**After:**

```javascript
showAlert({
  title: 'Success',
  message: 'Operation completed!',
  type: 'success',
})
```

**Before:**

```javascript
if (window.confirm('Are you sure?')) {
  deleteItem()
}
```

**After:**

```javascript
const confirmed = await showConfirm({
  title: 'Confirm',
  message: 'Are you sure?',
  type: 'warning',
})

if (confirmed) {
  deleteItem()
}
```

## Best Practices

1. **Use appropriate types**: Match the alert type to the message (success for positive outcomes, danger for errors)
2. **Keep messages concise**: Use clear, short messages that users can quickly understand
3. **Use meaningful titles**: Provide context with descriptive titles
4. **Customize button text**: Make button labels action-specific (e.g., "Delete" instead of "OK")
5. **Handle async operations**: Always use await with showConfirm for proper flow control
