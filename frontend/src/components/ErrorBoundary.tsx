import React from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  level?: 'page' | 'section';
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { level = 'section' } = this.props;
    const { error } = this.state;

    if (level === 'page') {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-red-500/30 rounded-xl p-8 max-w-md w-full text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-red-500/10 rounded-full">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-white">Something went wrong</h1>
            <p className="text-gray-400 text-sm">
              An unexpected error occurred. Please reload the page to continue.
            </p>
            {error && (
              <p className="text-xs text-red-400 font-mono bg-gray-900 rounded p-2 text-left break-all">
                {error.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <div className="p-3 bg-red-500/10 rounded-full">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
        </div>
        <h2 className="text-base font-semibold text-white">This section encountered an error</h2>
        <p className="text-gray-400 text-sm max-w-sm">
          An unexpected error occurred while rendering this section. You can try again or navigate to another section.
        </p>
        {error && (
          <p className="text-xs text-red-400 font-mono bg-gray-800 border border-gray-700 rounded p-2 max-w-sm text-left break-all">
            {error.message}
          </p>
        )}
        <button
          onClick={this.reset}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm flex items-center gap-2"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
