import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card border-danger">
                <div className="card-header bg-danger text-white">
                  <h4 className="mb-0">Oops! Something went wrong</h4>
                </div>
                <div className="card-body">
                  <p className="mb-3">
                    An unexpected error occurred. Please try refreshing the page or contact support
                    if the problem persists.
                  </p>

                  {this.state.error && (
                    <details className="mb-3">
                      <summary className="text-muted" style={{ cursor: 'pointer' }}>
                        Error Details
                      </summary>
                      <div className="mt-2 p-3 bg-light rounded">
                        <p className="mb-2">
                          <strong>Error:</strong> {this.state.error.toString()}
                        </p>
                        {this.state.errorInfo && (
                          <pre
                            className="mb-0 small"
                            style={{
                              maxHeight: '300px',
                              overflow: 'auto',
                              fontSize: '0.85rem',
                            }}
                          >
                            {this.state.errorInfo.componentStack}
                          </pre>
                        )}
                      </div>
                    </details>
                  )}

                  <div className="d-flex gap-2">
                    <button className="btn btn-primary" onClick={this.handleReset}>
                      Try Again
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => (window.location.href = '/')}
                    >
                      Go Home
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
