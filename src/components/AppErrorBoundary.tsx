import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("Uncaught application error", error, info);
    }
  }

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <h1 className="heading-xl mb-4">Something Went Wrong</h1>
            <p className="body-l mb-6" style={{ color: "var(--medium-grey)" }}>
              Reload the application to recover. Your locally saved boards will
              remain available.
            </p>
            <button type="button" className="btn btn-primary-lg" onClick={this.reload}>
              Reload Application
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
