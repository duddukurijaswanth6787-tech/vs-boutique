import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SectionLoader, PageError, EmptyState, InlineError, ApiErrorAlert } from './FeedbackStates';

describe('FeedbackStates', () => {
  describe('SectionLoader', () => {
    it('renders with default message', () => {
      render(<SectionLoader />);
      expect(screen.getByText(/loading/i)).toBeTruthy();
    });
    it('renders with custom message', () => {
      render(<SectionLoader message="Loading products..." />);
      expect(screen.getByText('Loading products...')).toBeTruthy();
    });
  });

  describe('PageError', () => {
    it('renders title and message', () => {
      render(<PageError title="Error" message="Something went wrong" />);
      expect(screen.getByText('Error')).toBeTruthy();
      expect(screen.getByText('Something went wrong')).toBeTruthy();
    });
    it('renders retry button when retry provided', () => {
      const retry = jest.fn();
      render(<PageError title="Error" retry={retry} />);
      const btn = screen.getByText('Try Again');
      fireEvent.click(btn);
      expect(retry).toHaveBeenCalled();
    });
  });

  describe('EmptyState', () => {
    it('renders title and description', () => {
      render(<EmptyState title="No data" description="Add some items" />);
      expect(screen.getByText('No data')).toBeTruthy();
      expect(screen.getByText('Add some items')).toBeTruthy();
    });
  });

  describe('InlineError', () => {
    it('renders error message', () => {
      render(<InlineError message="Field required" />);
      expect(screen.getByText('Field required')).toBeTruthy();
    });
  });

  describe('ApiErrorAlert', () => {
    it('renders nothing when message is null', () => {
      const { container } = render(<ApiErrorAlert message={null} />);
      expect(container.firstChild).toBeNull();
    });
    it('renders error message when provided', () => {
      render(<ApiErrorAlert message="Server error" />);
      expect(screen.getByText('Server error')).toBeTruthy();
    });
  });
});
