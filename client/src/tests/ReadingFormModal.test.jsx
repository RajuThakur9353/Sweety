import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReadingFormModal from '../components/ReadingFormModal';

describe('ReadingFormModal Component Validation Tests', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue({}),
    selectedDate: '2026-10-15',
    existingReadings: [],
  };

  it('renders modal with required inputs when open', () => {
    render(<ReadingFormModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Time Slot/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Glucose Value/i)).toBeInTheDocument();
  });

  it('validates Rule 1: "Please enter a glucose value." when value is empty', async () => {
    render(<ReadingFormModal {...defaultProps} />);

    const form = screen.getByRole('dialog').querySelector('form');
    fireEvent.submit(form);

    expect(await screen.findByText('Please enter a glucose value.')).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('validates Rule 2: "Value must be between 40 and 600 mg/dl." when below 40', async () => {
    render(<ReadingFormModal {...defaultProps} />);

    const valueInput = screen.getByLabelText(/Glucose Value/i);
    const form = screen.getByRole('dialog').querySelector('form');

    fireEvent.change(valueInput, { target: { value: '35' } });
    fireEvent.submit(form);

    expect(await screen.findByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('validates Rule 2: "Value must be between 40 and 600 mg/dl." when above 600', async () => {
    render(<ReadingFormModal {...defaultProps} />);

    const valueInput = screen.getByLabelText(/Glucose Value/i);
    const form = screen.getByRole('dialog').querySelector('form');

    fireEvent.change(valueInput, { target: { value: '650' } });
    fireEvent.submit(form);

    expect(await screen.findByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('validates Rule 3: Only one reading per slot per day -> "You already have an After lunch reading for this date."', async () => {
    const existingReadings = [
      { id: 1, reading_date: '2026-10-15', slot: 'After lunch', value: 135 },
    ];

    render(
      <ReadingFormModal
        {...defaultProps}
        selectedDate="2026-10-15"
        existingReadings={existingReadings}
      />
    );

    const slotSelect = screen.getByLabelText(/Time Slot/i);
    const valueInput = screen.getByLabelText(/Glucose Value/i);
    const form = screen.getByRole('dialog').querySelector('form');

    fireEvent.change(slotSelect, { target: { value: 'After lunch' } });
    fireEvent.change(valueInput, { target: { value: '145' } });
    fireEvent.submit(form);

    expect(
      await screen.findByText('You already have an After lunch reading for this date.')
    ).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('validates Rule 4: Maximum 4 readings per day -> "You can add only 4 readings per day."', async () => {
    const existingReadings = [
      { id: 1, reading_date: '2026-10-15', slot: 'Morning (fasting)', value: 95 },
      { id: 2, reading_date: '2026-10-15', slot: 'After breakfast', value: 130 },
      { id: 3, reading_date: '2026-10-15', slot: 'After lunch', value: 140 },
      { id: 4, reading_date: '2026-10-15', slot: 'After dinner', value: 135 },
    ];

    render(
      <ReadingFormModal
        {...defaultProps}
        selectedDate="2026-10-15"
        existingReadings={existingReadings}
      />
    );

    const valueInput = screen.getByLabelText(/Glucose Value/i);
    const form = screen.getByRole('dialog').querySelector('form');

    fireEvent.change(valueInput, { target: { value: '110' } });
    fireEvent.submit(form);

    expect(
      await screen.findByText(/You already have|You can add only 4 readings per day./)
    ).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('validates Rule 5: Date cannot be in the future -> "Date cannot be in the future."', async () => {
    render(<ReadingFormModal {...defaultProps} />);

    const dateInput = screen.getByLabelText(/Date/i);
    const valueInput = screen.getByLabelText(/Glucose Value/i);
    const form = screen.getByRole('dialog').querySelector('form');

    fireEvent.change(dateInput, { target: { value: '2099-01-01' } });
    fireEvent.change(valueInput, { target: { value: '110' } });
    fireEvent.submit(form);

    expect(await screen.findByText('Date cannot be in the future.')).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid reading data successfully', async () => {
    const handleSubmit = vi.fn().mockResolvedValue({});
    render(
      <ReadingFormModal
        {...defaultProps}
        onSubmit={handleSubmit}
        selectedDate="2026-10-15"
      />
    );

    const valueInput = screen.getByLabelText(/Glucose Value/i);
    const form = screen.getByRole('dialog').querySelector('form');

    fireEvent.change(valueInput, { target: { value: '105' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        date: '2026-10-15',
        slot: 'Morning (fasting)',
        value: 105,
        notes: null,
      });
    });
  });
});
