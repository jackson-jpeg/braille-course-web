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
 * the whole page.
 */
export default class GameErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[${this.props.gameName}] crashed:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="game-board game-board--center" role="alert">
          <h2>Oops — {this.props.gameName} tripped over a dot</h2>
          <p className="muted">Sorry about that. Trying again usually fixes it.</p>
          <button type="button" className="btn" onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
