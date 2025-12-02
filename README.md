# MailGoat

Email template management and bulk sending tool with webhook integration.

## Features

- **Template Management**: Create, edit, and manage email templates with dynamic parameters
- **Single Email Sending**: Send personalized emails to individuals or groups
- **Bulk Email Sending**: Send multiple emails using CSV upload or manual entry
- **Webhook Integration**: Configure custom webhooks for email delivery
- **Real-time Preview**: See how your emails will look before sending
- **Parameter Substitution**: Use `{{parameter}}` syntax for dynamic content

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## Configuration

### Webhook Settings

Navigate to **Settings** to configure your email webhook:

1. Enter your webhook URL
2. Add custom headers (e.g., API keys)
3. Configure request body property mapping
4. Test the webhook before saving

## Usage

### Creating Templates

1. Go to **Templates** page
2. Click "Create New Template"
3. Enter template name, subject, and HTML content
4. Use `{{parameterName}}` for dynamic values
5. Save the template

### Sending Single Emails

1. Go to **Send Email** page
2. Select a template
3. Fill in parameter values
4. Enter recipient email addresses (comma or semicolon separated)
5. Optionally add CC recipients
6. Preview and send

### Bulk Sending

1. Go to **Send Email** > **Bulk Send** tab
2. Select a template
3. Choose input method:
   - **CSV Upload**: Download sample CSV, fill it, and upload
   - **Manual Entry**: Add recipients one by one
4. Review and send

## Security

- All HTML content is sanitized using DOMPurify to prevent XSS attacks
- Email validation using industry-standard validator library
- Request cancellation support for long-running operations
- Error boundaries to catch and handle React errors gracefully

## Technology Stack

- **Frontend**: React 19, React Router, Bootstrap 5
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **CSV Parsing**: PapaParse
- **HTML Sanitization**: DOMPurify
- **Email Validation**: Validator.js
- **Testing**: Vitest, React Testing Library
- **Code Quality**: ESLint, Prettier

## Development

### Project Structure

```
src/
├── components/       # Reusable React components
├── pages/           # Page components
├── services/        # Business logic and API calls
├── repositories/    # Data access layer
├── utils/           # Utility functions
└── test/            # Test setup and utilities
```

### Running Tests

Tests are written using Vitest and React Testing Library. Run tests with:

```bash
npm test
```

## License

MIT

## Contributing

Contributions are welcome! Please ensure all tests pass and code is properly formatted before submitting PRs.
