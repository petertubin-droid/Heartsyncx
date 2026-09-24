import React, { Component, ErrorInfo, ReactNode } from 'react';
import { reportFatal } from '../lib/codeSentry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    // Safely log to console in development, or transmit to production logging systems
    console.error("⚡ [Heartsync Global Error Boundary Boundary]", error, errorInfo);
    // Code sentry: fatal render crashes leave immediately, no batch delay.
    try { reportFatal(error, 'react-fatal'); } catch { /* monitoring must never throw */ }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.removeItem('hs_site_settings');
      localStorage.removeItem('hs_posts');
      localStorage.removeItem('hs_categories');
      window.location.href = '/';
    } catch (e) {
      console.warn('Failed to clear client safe-cache:', e);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 font-sans select-none selection:bg-rose-500/20 transition-colors duration-200">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 rounded-full flex items-center justify-center mx-auto text-rose-500 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Heartsync is restarting
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                An unexpected interface error occurred. We have securely caught this exception to protect your ongoing session data.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 font-mono text-xs text-zinc-600 dark:text-zinc-400 overflow-x-auto max-h-40 scrollbar-thin">
                <span className="font-semibold text-rose-600 dark:text-rose-400">Error: </span>
                {this.state.error.message || 'Unknown exception'}
                {this.state.error.stack && (
                  <pre className="mt-2 text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-600 whitespace-pre-wrap select-text">
                    {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="error-boundary-reload-btn"
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex justify-center items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-medium text-xs rounded-xl transition-all duration-150 shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                Reload Page
              </button>
              <button
                id="error-boundary-reset-btn"
                type="button"
                onClick={this.handleResetCache}
                className="flex-1 inline-flex justify-center items-center px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] text-zinc-700 dark:text-zinc-300 font-medium text-xs rounded-xl transition-all duration-150 cursor-pointer"
              >
                Clear Cache & Reset
              </button>
            </div>
            
            <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
              Diagnostic ID: HS-ERR-BOUNDARY
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
