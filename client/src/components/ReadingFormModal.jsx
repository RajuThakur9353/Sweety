import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Calendar, Clock, Activity, Check } from 'lucide-react';

const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ReadingFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  existingReadings = [],
  selectedDate = null,
  initialSlot = null,
}) {
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(SLOTS[0]);
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (initialData) {
        // Editing existing reading
        setDate(initialData.reading_date || initialData.date || getTodayString());
        setSlot(initialData.slot || SLOTS[0]);
        setValue(initialData.value !== undefined ? String(initialData.value) : '');
        setNotes(initialData.notes || '');
      } else {
        // New reading
        setDate(selectedDate || getTodayString());
        setSlot(initialSlot || SLOTS[0]);
        setValue('');
        setNotes('');
      }
    }
  }, [isOpen, initialData, selectedDate, initialSlot]);

  if (!isOpen) return null;

  const validate = () => {
    setError('');

    // Rule: Date cannot be in the future
    const today = getTodayString();
    if (!date) {
      setError('Please enter a valid date.');
      return false;
    }
    if (date > today) {
      setError('Date cannot be in the future.');
      return false;
    }

    // Rule: Slot is required
    if (!slot) {
      setError('Please select a time slot.');
      return false;
    }

    // Rule: Value is required
    if (value === undefined || value === null || String(value).trim() === '') {
      setError('Please enter a glucose value.');
      return false;
    }

    // Rule: Value must be a whole number between 40 and 600
    const num = Number(value);
    if (!Number.isInteger(num) || num < 40 || num > 600) {
      setError('Value must be between 40 and 600 mg/dl.');
      return false;
    }

    // Rule: Only one reading per slot per day & Maximum 4 readings per day (client check when available)
    if (existingReadings && existingReadings.length > 0) {
      const sameDateReadings = existingReadings.filter(
        (r) => (r.reading_date === date || r.date === date) && (!initialData || r.id !== initialData.id)
      );

      // Check slot duplication
      const duplicateSlot = sameDateReadings.find((r) => r.slot === slot);
      if (duplicateSlot) {
        const article = /^[aeiou]/i.test(slot) ? 'an' : 'a';
        setError(`You already have ${article} ${slot} reading for this date.`);
        return false;
      }

      // Check maximum 4 readings
      if (sameDateReadings.length >= 4) {
        setError('You can add only 4 readings per day.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({
        date,
        slot,
        value: parseInt(value, 10),
        notes: notes ? notes.trim() : null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save reading. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 id="modal-title" className="text-lg font-bold text-slate-900">
              {initialData ? 'Edit Blood Glucose Reading' : 'Record Blood Glucose Reading'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            data-testid="error-message"
            className="mx-6 mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2.5 animate-shake"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date Field */}
          <div>
            <label htmlFor="reading-date" className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" /> Date
            </label>
            <input
              id="reading-date"
              type="date"
              max={getTodayString()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              required
            />
          </div>

          {/* Slot Field */}
          <div>
            <label htmlFor="reading-slot" className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" /> Time Slot (4 per day)
            </label>
            <select
              id="reading-slot"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
            >
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Only one reading per slot per day. Max 4 readings per day.
            </p>
          </div>

          {/* Glucose Value Field */}
          <div>
            <label htmlFor="glucose-value" className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-slate-400" /> Glucose Value (mg/dl)
            </label>
            <div className="relative">
              <input
                id="glucose-value"
                type="number"
                placeholder="e.g. 110"
                min="40"
                max="600"
                step="1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-16 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                mg/dl
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Valid range: Whole number between 40 and 600 mg/dl.
            </p>
          </div>

          {/* Optional Notes */}
          <div>
            <label htmlFor="reading-notes" className="block text-sm font-semibold text-slate-700 mb-1">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="reading-notes"
              rows="2"
              placeholder="e.g. 20 min walk after meal, feeling good"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition shadow-sm shadow-rose-200 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{initialData ? 'Update Reading' : 'Save Reading'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
