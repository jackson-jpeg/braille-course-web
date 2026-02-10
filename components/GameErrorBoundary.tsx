'use client';

import React from 'react';

interface Props {
  gameName: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Per-game error boundary so one crashed game doesn't take down
 * the entire Interactive page.
 */
export default class GameErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="game-error-card">
          <p>
            <strong>{this.props.gameName}</strong> couldn&apos;t load.
          </p>
          <button
            className="game-error-retry"
            onClick={() => this.setState({ hasError: false })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
