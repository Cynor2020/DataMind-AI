import React, { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold text-red-600">Something went wrong.</h1>
          <p>Please try again or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;