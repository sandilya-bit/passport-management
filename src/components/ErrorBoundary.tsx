import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Hook a real error-reporting service (Sentry etc.) here.
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="card max-w-md w-full p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-500 dark:bg-danger-500/15">
              <span className="icon text-[30px]">report</span>
            </span>
            <h1 className="mt-4 text-lg font-bold text-ink-light dark:text-ink-dark">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              An unexpected error occurred while rendering this page. Our team has been notified.
            </p>
            {import.meta.env.DEV && (
              <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-slate-100 dark:bg-slate-800 p-3 text-left text-xs text-danger-600">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" onClick={() => window.location.assign('/')}>
                Go Home
              </Button>
              <Button onClick={() => this.setState({ error: null })} leftIcon={<span className="icon text-[16px]">refresh</span>}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
