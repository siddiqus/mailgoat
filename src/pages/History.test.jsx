import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import History from './History'
import * as emailHistoryService from '../services/emailHistoryService'
import * as templateRepositoryService from '../services/templateRepositoryService'

// Mock the services
vi.mock('../services/emailHistoryService')
vi.mock('../services/templateRepositoryService')

// Mock the modal components
vi.mock('../components/EmailDetailModal', () => ({
  default: ({ emailRecord, onClose }) => (
    <div data-testid="email-detail-modal">
      <div>Email: {emailRecord.subject}</div>
      <button onClick={onClose}>Close Modal</button>
    </div>
  ),
}))

vi.mock('../components/TemplateDetailModal', () => ({
  default: ({ template, onClose }) => (
    <div data-testid="template-detail-modal">
      <div>Template: {template.name}</div>
      <button onClick={onClose}>Close Modal</button>
    </div>
  ),
}))

describe('History', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear any alerts
    global.alert = vi.fn()
    global.console.error = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading spinner while fetching history', () => {
      emailHistoryService.getAllHistory.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<History />)

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty message when no emails have been sent', async () => {
      emailHistoryService.getAllHistory.mockResolvedValue([])

      render(<History />)

      await waitFor(() => {
        expect(
          screen.getByText(/No emails sent yet. Sent emails will appear here in your history./i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Email History Display', () => {
    const mockHistory = [
      {
        id: '1',
        templateName: 'Welcome Email',
        templateId: 'template-1',
        recipients: ['user1@test.com', 'user2@test.com'],
        ccList: ['cc1@test.com'],
        subject: 'Welcome to our service',
        htmlBody: '<p>Welcome!</p>',
        sentAt: '2025-12-03T10:00:00Z',
      },
      {
        id: '2',
        templateName: 'Follow Up',
        templateId: 'template-2',
        recipients: ['user3@test.com'],
        ccList: [],
        subject: 'Follow up email',
        htmlBody: '<p>Follow up</p>',
        sentAt: '2025-12-02T09:00:00Z',
      },
    ]

    beforeEach(() => {
      emailHistoryService.getAllHistory.mockResolvedValue(mockHistory)
    })

    it('should display email history table with correct headers', async () => {
      render(<History />)

      await waitFor(() => {
        expect(screen.getByText('Email History')).toBeInTheDocument()
      })

      expect(screen.getByText('Sent At')).toBeInTheDocument()
      expect(screen.getByText('Template')).toBeInTheDocument()
      expect(screen.getByText('Recipients')).toBeInTheDocument()
      expect(screen.getByText('CC')).toBeInTheDocument()
      expect(screen.getByText('Subject')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('should display all email records', async () => {
      render(<History />)

      await waitFor(() => {
        expect(screen.getByText('Welcome to our service')).toBeInTheDocument()
        expect(screen.getByText('Follow up email')).toBeInTheDocument()
      })

      expect(screen.getByText('Welcome Email')).toBeInTheDocument()
      expect(screen.getByText('Follow Up')).toBeInTheDocument()
    })

    it('should format recipients correctly when more than 2', async () => {
      const historyWithManyRecipients = [
        {
          id: '1',
          templateName: 'Test',
          templateId: 'template-1',
          recipients: ['user1@test.com', 'user2@test.com', 'user3@test.com', 'user4@test.com'],
          ccList: [],
          subject: 'Test Subject',
          htmlBody: '<p>Test</p>',
          sentAt: '2025-12-03T10:00:00Z',
        },
      ]

      emailHistoryService.getAllHistory.mockResolvedValue(historyWithManyRecipients)

      render(<History />)

      await waitFor(() => {
        expect(screen.getByText('user1@test.com, user2@test.com +2 more')).toBeInTheDocument()
      })
    })

    it('should format recipients correctly when 2 or fewer', async () => {
      render(<History />)

      await waitFor(() => {
        expect(screen.getByText('user1@test.com, user2@test.com')).toBeInTheDocument()
        expect(screen.getByText('user3@test.com')).toBeInTheDocument()
      })
    })

    it('should display CC list or dash if empty', async () => {
      render(<History />)

      await waitFor(() => {
        expect(screen.getByText('cc1@test.com')).toBeInTheDocument()
      })

      // Find all cells with just a dash
      const cells = screen.getAllByText('-')
      expect(cells.length).toBeGreaterThan(0)
    })

    it('should display total count of emails', async () => {
      render(<History />)

      await waitFor(() => {
        expect(screen.getByText('Total: 2 email(s) sent')).toBeInTheDocument()
      })
    })

    it('should format sent date correctly', async () => {
      render(<History />)

      await waitFor(() => {
        // Check that date is formatted using toLocaleString
        const dateElement = screen.getByText(/12\/3\/2025/i, { exact: false })
        expect(dateElement).toBeInTheDocument()
      })
    })
  })

  describe('Template Interaction', () => {
    const mockHistory = [
      {
        id: '1',
        templateName: 'Welcome Email',
        templateId: 'template-1',
        recipients: ['user1@test.com'],
        ccList: [],
        subject: 'Welcome',
        htmlBody: '<p>Welcome!</p>',
        sentAt: '2025-12-03T10:00:00Z',
      },
    ]

    const mockTemplate = {
      id: 'template-1',
      name: 'Welcome Email',
      subject: 'Welcome {{name}}',
      htmlString: '<p>Hello {{name}}</p>',
      parameters: ['name'],
    }

    beforeEach(() => {
      emailHistoryService.getAllHistory.mockResolvedValue(mockHistory)
    })

    it('should display template as clickable link when templateId exists', async () => {
      render(<History />)

      await waitFor(() => {
        const templateButton = screen.getByRole('button', { name: 'Welcome Email' })
        expect(templateButton).toBeInTheDocument()
        expect(templateButton).toHaveAttribute('title', 'View template details')
      })
    })

    it('should open template detail modal when template link is clicked', async () => {
      const user = userEvent.setup()
      templateRepositoryService.getTemplateById.mockResolvedValue(mockTemplate)

      render(<History />)

      await waitFor(() => {
        expect(screen.getByText('Welcome Email')).toBeInTheDocument()
      })

      const templateButton = screen.getByRole('button', { name: 'Welcome Email' })
      await user.click(templateButton)

      await waitFor(() => {
        expect(templateRepositoryService.getTemplateById).toHaveBeenCalledWith('template-1')
        expect(screen.getByTestId('template-detail-modal')).toBeInTheDocument()
        expect(screen.getByText('Template: Welcome Email')).toBeInTheDocument()
      })
    })

    it('should close template modal when close button is clicked', async () => {
      const user = userEvent.setup()
      templateRepositoryService.getTemplateById.mockResolvedValue(mockTemplate)

      render(<History />)

      await waitFor(() => {
        expect(screen.getByText('Welcome Email')).toBeInTheDocument()
      })

      const templateButton = screen.getByRole('button', { name: 'Welcome Email' })
      await user.click(templateButton)

      await waitFor(() => {
        expect(screen.getByTestId('template-detail-modal')).toBeInTheDocument()
      })

      const closeButton = screen.getByText('Close Modal')
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByTestId('template-detail-modal')).not.toBeInTheDocument()
      })
    })

    it('should show alert when template is not found', async () => {
      const user = userEvent.setup()
      templateRepositoryService.getTemplateById.mockResolvedValue(null)

      render(<History />)

      await waitFor(() => {
        expect(screen.getByText('Welcome Email')).toBeInTheDocument()
      })

      const templateButton = screen.getByRole('button', { name: 'Welcome Email' })
      await user.click(templateButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Template not found. It may have been deleted.')
      })

      expect(screen.queryByTestId('template-detail-modal')).not.toBeInTheDocument()
    })

    it('should show alert when template loading fails', async () => {
      const user = userEvent.setup()
      templateRepositoryService.getTemplateById.mockRejectedValue(new Error('Failed to load'))

      render(<History />)

      await waitFor(() => {
        expect(screen.getByText('Welcome Email')).toBeInTheDocument()
      })

      const templateButton = screen.getByRole('button', { name: 'Welcome Email' })
      await user.click(templateButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to load template details')
        expect(global.console.error).toHaveBeenCalled()
      })
    })

    it('should display template name as text when no templateId', async () => {
      const historyWithoutTemplate = [
        {
          id: '1',
          templateName: 'Custom Template',
          templateId: null,
          recipients: ['user1@test.com'],
          ccList: [],
          subject: 'Custom',
          htmlBody: '<p>Custom</p>',
          sentAt: '2025-12-03T10:00:00Z',
        },
      ]

      emailHistoryService.getAllHistory.mockResolvedValue(historyWithoutTemplate)

      render(<History />)

      await waitFor(() => {
        const templateText = screen.getByText('Custom Template')
        expect(templateText).toBeInTheDocument()
        expect(templateText).toHaveClass('text-muted')
        expect(templateText.tagName).toBe('SPAN')
      })
    })
  })

  describe('Email Detail Interaction', () => {
    const mockHistory = [
      {
        id: '1',
        templateName: 'Welcome Email',
        templateId: 'template-1',
        recipients: ['user1@test.com'],
        ccList: [],
        subject: 'Welcome to our service',
        htmlBody: '<p>Welcome!</p>',
        sentAt: '2025-12-03T10:00:00Z',
      },
    ]

    beforeEach(() => {
      emailHistoryService.getAllHistory.mockResolvedValue(mockHistory)
    })

    it('should display View button for each email', async () => {
      render(<History />)

      await waitFor(() => {
        const viewButton = screen.getByRole('button', { name: 'View' })
        expect(viewButton).toBeInTheDocument()
        expect(viewButton).toHaveAttribute('title', 'View email')
      })
    })

    it('should open email detail modal when View button is clicked', async () => {
      const user = userEvent.setup()

      render(<History />)

      await waitFor(() => {
        expect(screen.getByText('Welcome to our service')).toBeInTheDocument()
      })

      const viewButton = screen.getByRole('button', { name: 'View' })
      await user.click(viewButton)

      await waitFor(() => {
        expect(screen.getByTestId('email-detail-modal')).toBeInTheDocument()
        expect(screen.getByText('Email: Welcome to our service')).toBeInTheDocument()
      })
    })

    it('should close email detail modal when close button is clicked', async () => {
      const user = userEvent.setup()

      render(<History />)

      await waitFor(() => {
        expect(screen.getByText('Welcome to our service')).toBeInTheDocument()
      })

      const viewButton = screen.getByRole('button', { name: 'View' })
      await user.click(viewButton)

      await waitFor(() => {
        expect(screen.getByTestId('email-detail-modal')).toBeInTheDocument()
      })

      const closeButton = screen.getByText('Close Modal')
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByTestId('email-detail-modal')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should show alert when loading history fails', async () => {
      emailHistoryService.getAllHistory.mockRejectedValue(new Error('Failed to load'))

      render(<History />)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to load email history')
        expect(global.console.error).toHaveBeenCalledWith(
          'Error loading email history:',
          expect.any(Error)
        )
      })
    })

    it('should stop showing loading spinner after error', async () => {
      emailHistoryService.getAllHistory.mockRejectedValue(new Error('Failed to load'))

      render(<History />)

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle non-array recipients', async () => {
      const historyWithStringRecipients = [
        {
          id: '1',
          templateName: 'Test',
          templateId: 'template-1',
          recipients: 'single@test.com',
          ccList: [],
          subject: 'Test',
          htmlBody: '<p>Test</p>',
          sentAt: '2025-12-03T10:00:00Z',
        },
      ]

      emailHistoryService.getAllHistory.mockResolvedValue(historyWithStringRecipients)

      render(<History />)

      await waitFor(() => {
        expect(screen.getByText('single@test.com')).toBeInTheDocument()
      })
    })

    it('should handle missing ccList', async () => {
      const historyWithoutCC = [
        {
          id: '1',
          templateName: 'Test Template',
          templateId: 'template-1',
          recipients: ['user@test.com'],
          subject: 'Test Subject',
          htmlBody: '<p>Test</p>',
          sentAt: '2025-12-03T10:00:00Z',
        },
      ]

      emailHistoryService.getAllHistory.mockResolvedValue(historyWithoutCC)

      render(<History />)

      await waitFor(() => {
        expect(screen.getByText('Test Template')).toBeInTheDocument()
      })

      // Should show dash for missing CC
      const cells = screen.getAllByText('-')
      expect(cells.length).toBeGreaterThan(0)
    })

    it('should handle empty recipients array', async () => {
      const historyWithEmptyRecipients = [
        {
          id: '1',
          templateName: 'Empty Recipients Template',
          templateId: 'template-1',
          recipients: [],
          ccList: [],
          subject: 'Empty Recipients Test',
          htmlBody: '<p>Test</p>',
          sentAt: '2025-12-03T10:00:00Z',
        },
      ]

      emailHistoryService.getAllHistory.mockResolvedValue(historyWithEmptyRecipients)

      render(<History />)

      await waitFor(() => {
        expect(screen.getByText('Empty Recipients Template')).toBeInTheDocument()
      })
    })
  })

  describe('Component Lifecycle', () => {
    it('should load history on mount', async () => {
      emailHistoryService.getAllHistory.mockResolvedValue([])

      render(<History />)

      await waitFor(() => {
        expect(emailHistoryService.getAllHistory).toHaveBeenCalledTimes(1)
      })
    })

    it('should only call getAllHistory once on mount', async () => {
      emailHistoryService.getAllHistory.mockResolvedValue([])

      render(<History />)

      await waitFor(() => {
        expect(emailHistoryService.getAllHistory).toHaveBeenCalledTimes(1)
      })

      // Should not be called again
      await waitFor(() => {
        expect(emailHistoryService.getAllHistory).toHaveBeenCalledTimes(1)
      })
    })
  })
})
