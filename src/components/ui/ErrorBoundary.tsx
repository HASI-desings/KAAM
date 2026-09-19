import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

// Without this, one screen throwing silently blanks the entire app — this
// scopes failures to a visible message instead of a dead white page.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm font-semibold text-danger">Something broke on this screen</p>
          <p className="text-xs text-[var(--text-secondary)]">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="rounded-xl2 bg-teal px-4 py-2 text-xs font-semibold text-white"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
