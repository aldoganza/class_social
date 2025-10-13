import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
          background: 'var(--bg)'
        }}>
          <div className="card" style={{ maxWidth: 500 }}>
            <h2 style={{ color: '#ff3b30', marginBottom: 16 }}>⚠️ Something went wrong</h2>
            <p style={{ marginBottom: 20 }}>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            
            <div className="row gap" style={{ justifyContent: 'center' }}>
              <button 
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                🔄 Refresh Page
              </button>
              <button 
                className="btn btn-light"
                onClick={() => window.location.href = '/'}
              >
                🏠 Go Home
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: 20, textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--muted)' }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{ 
                  marginTop: 10, 
                  padding: 10, 
                  background: 'rgba(0,0,0,0.3)', 
                  borderRadius: 8,
                  fontSize: 12,
                  overflow: 'auto',
                  maxHeight: 300
                }}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
