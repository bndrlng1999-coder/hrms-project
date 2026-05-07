import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-shell">
          <div className="card mx-auto max-w-xl text-center">
            <p className="section-eyebrow">Recovery</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-500">The page hit an unexpected client error. Retry the view to continue.</p>
            <button type="button" className="btn btn-primary mt-5" onClick={() => this.setState({ hasError: false })}>
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
