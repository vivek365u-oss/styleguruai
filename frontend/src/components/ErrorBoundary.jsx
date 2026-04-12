/**
 * Error Boundary Component
 * Catches React component errors and displays a recovery UI
 */

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Log to external service (Sentry, etc.) if needed
    if (window.Sentry) {
      window.Sentry.captureException(error, { contexts: { react: errorInfo } });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleHardReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-[#050816] flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full">
            {/* Error Icon */}
            <div className="text-7xl text-center mb-6">💥</div>

            {/* Error Title */}
            <h1 className="text-3xl font-black text-white text-center mb-2">
              Oops! Something broke
            </h1>

            {/* Error Description */}
            <p className="text-red-200/80 text-center mb-6">
              We're sorry, but StyleGuruAI encountered an unexpected error. 
              Try refreshing or clearing your cache if the problem persists.
            </p>

            {/* Error Details (Development Only) */}
            {isDevelopment && this.state.error && (
              <div className="mb-6 p-3 bg-black/40 rounded-lg border border-red-500/30 overflow-auto max-h-40">
                <p className="text-red-300 text-xs font-mono mb-2 font-bold">Error Details:</p>
                <p className="text-red-200 text-xs font-mono">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="text-red-100 text-xs font-mono mt-2 whitespace-pre-wrap break-words">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Error Recovery Message */}
            {this.state.errorCount > 2 && (
              <div className="mb-6 p-3 bg-amber-500/20 rounded-lg border border-amber-500/50">
                <p className="text-amber-100 text-sm text-center">
                  Multiple errors detected. Try clearing your cache and data.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg text-white font-semibold transition-all"
              >
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-white font-semibold transition-all"
              >
                Refresh Page
              </button>

              {this.state.errorCount > 1 && (
                <button
                  onClick={this.handleHardReset}
                  className="w-full px-6 py-3 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 rounded-lg text-red-200 font-semibold transition-all text-sm"
                >
                  Clear Cache & Reset
                </button>
              )}

              <a
                href="/"
                className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 font-semibold transition-all text-center"
              >
                Go to Home
              </a>
            </div>

            {/* Support Message */}
            <p className="text-white/40 text-xs text-center mt-6">
              If this persists, please contact support at StyleGuruAI.in.gmail@gmail.com
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
