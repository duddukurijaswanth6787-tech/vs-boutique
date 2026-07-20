import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BulkActionBar from './BulkActionBar';

describe('BulkActionBar', () => {
  const mockOnClear = jest.fn();
  const mockAction = { label: 'Delete', onClick: jest.fn(), variant: 'danger' as const };

  beforeEach(() => { jest.clearAllMocks(); });

  it('renders nothing when selectedCount is 0 and no result', () => {
    const { container } = render(
      <BulkActionBar selectedCount={0} actions={[mockAction]} onClear={mockOnClear} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows selected count and action buttons', () => {
    render(<BulkActionBar selectedCount={3} actions={[mockAction]} onClear={mockOnClear} />);
    expect(screen.getByText(/3 selected/)).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('calls action onClick when button clicked', () => {
    render(<BulkActionBar selectedCount={1} actions={[mockAction]} onClear={mockOnClear} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(mockAction.onClick).toHaveBeenCalled();
  });

  it('calls onClear when close button clicked', () => {
    render(<BulkActionBar selectedCount={1} actions={[mockAction]} onClear={mockOnClear} />);
    const closeBtn = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(closeBtn);
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('shows result when result provided', () => {
    const result = { success: ['a', 'b'], failed: [{ id: 'c', error: 'fail' }], successCount: 2, failureCount: 1 };
    render(<BulkActionBar selectedCount={0} actions={[mockAction]} onClear={mockOnClear} result={result} />);
    expect(screen.getByText(/2 succeeded/)).toBeTruthy();
    expect(screen.getByText(/1 failed/)).toBeTruthy();
  });
});
