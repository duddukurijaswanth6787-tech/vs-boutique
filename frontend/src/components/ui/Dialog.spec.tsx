import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dialog from './Dialog';

describe('Dialog', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => { jest.clearAllMocks(); document.body.style.overflow = ''; });

  it('renders nothing when closed', () => {
    const { container } = render(<Dialog open={false} onClose={mockOnClose} title="Test">Content</Dialog>);
    expect(container.firstChild).toBeNull();
  });

  it('renders title and content when open', () => {
    render(<Dialog open={true} onClose={mockOnClose} title="My Dialog">Hello</Dialog>);
    expect(screen.getByText('My Dialog')).toBeTruthy();
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('calls onClose on ESC key', () => {
    render(<Dialog open={true} onClose={mockOnClose} title="T">C</Dialog>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders footer when provided', () => {
    render(<Dialog open={true} onClose={mockOnClose} title="T" footer={<button>Save</button>}>C</Dialog>);
    expect(screen.getByText('Save')).toBeTruthy();
  });
});
