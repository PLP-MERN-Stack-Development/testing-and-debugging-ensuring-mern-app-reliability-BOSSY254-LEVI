import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostForm from '../../components/PostForm';

// Mock the validation utility
jest.mock('../../utils/validation', () => ({
  validatePost: jest.fn(),
}));

import { validatePost } from '../../utils/validation';

describe('PostForm Component', () => {
  const mockOnSubmit = jest.fn();
  const defaultProps = {
    onSubmit: mockOnSubmit,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    validatePost.mockReturnValue({ isValid: true, errors: {} });
  });

  it('renders form fields correctly', () => {
    render(<PostForm {...defaultProps} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit post/i })).toBeInTheDocument();
  });

  it('displays initial data when provided', () => {
    const initialData = {
      title: 'Test Title',
      content: 'Test Content',
      category: 'technology',
    };

    render(<PostForm {...defaultProps} initialData={initialData} />);

    expect(screen.getByDisplayValue('Test Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Content')).toBeInTheDocument();
    expect(screen.getByDisplayValue('technology')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<PostForm {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('button', { name: /submitting/i })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('validates form and shows errors for invalid data', async () => {
    validatePost.mockReturnValue({
      isValid: false,
      errors: {
        title: 'Title is required',
        content: 'Content must be at least 10 characters',
      },
    });

    render(<PostForm {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /submit post/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Content must be at least 10 characters')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const formData = {
      title: 'Valid Title',
      content: 'This is valid content with more than 10 characters',
      category: 'technology',
    };

    render(<PostForm {...defaultProps} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: formData.title },
    });
    fireEvent.change(screen.getByLabelText(/content/i), {
      target: { value: formData.content },
    });
    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: formData.category },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /submit post/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(formData);
    });
  });

  it('clears errors when user starts typing', async () => {
    validatePost.mockReturnValue({
      isValid: false,
      errors: { title: 'Title is required' },
    });

    render(<PostForm {...defaultProps} />);

    // Trigger validation error
    const submitButton = screen.getByRole('button', { name: /submit post/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    // Start typing in title field
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'New Title' },
    });

    expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
  });

  it('handles submission errors gracefully', async () => {
    const errorMessage = 'Submission failed';
    mockOnSubmit.mockRejectedValue(new Error(errorMessage));

    render(<PostForm {...defaultProps} />);

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Title' },
    });
    fireEvent.change(screen.getByLabelText(/content/i), {
      target: { value: 'Test content with enough characters' },
    });
    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: 'technology' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit post/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to submit form. Please try again.')).toBeInTheDocument();
    });
  });

  it('resets form after successful submission', async () => {
    mockOnSubmit.mockResolvedValue({});

    render(<PostForm {...defaultProps} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Title' },
    });
    fireEvent.change(screen.getByLabelText(/content/i), {
      target: { value: 'Test content' },
    });
    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: 'technology' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /submit post/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Check form is reset
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/content/i)).toHaveValue('');
    expect(screen.getByLabelText(/category/i)).toHaveValue('');
  });
});
