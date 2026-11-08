import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Navbar from '../components/Navbar';
import ReportCards from '../components/ReportCards';
import DailyBreakdown from '../components/DailyBreakdown';
import GlucoseTrendChart from '../components/GlucoseTrendChart';
import ReadingsTable from '../components/ReadingsTable';
import ReadingFormModal from '../components/ReadingFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Calendar, ChevronLeft, ChevronRight, UserCheck, RefreshCw } from 'lucide-react';

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [reports, setReports] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Table pagination state
  const [tableReadings, setTableReadings] = useState([]);
  const [tablePagination, setTablePagination] = useState(null);
  const [tablePage, setTablePage] = useState(1);
  const [tableLoading, setTableLoading] = useState(true);

  // Modal & Dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [initialSlot, setInitialSlot] = useState(null);
  const [deletingReading, setDeletingReading] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Doctor Role Bonus state
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // Load doctor's patient list if user is a doctor
  useEffect(() => {
    if (user?.role === 'doctor') {
      api.getPatients()
        .then((res) => {
          setPatients(res.patients || []);
          if (res.patients?.length > 0) {
            setSelectedPatientId(String(res.patients[0].id));
          }
        })
        .catch((err) => console.error('Failed to load patients for doctor:', err));
    }
  }, [user]);

  // Load Reports for selected date & target patient
  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const patientIdParam = user?.role === 'doctor' ? selectedPatientId : null;
      const data = await api.getReports(selectedDate, patientIdParam);
      setReports(data.reports);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setReportsLoading(false);
    }
  }, [selectedDate, selectedPatientId, user]);

  // Load Paginated Readings Table
  const fetchTableReadings = useCallback(async (page = 1) => {
    setTableLoading(true);
    try {
      const patientIdParam = user?.role === 'doctor' ? selectedPatientId : null;
      const data = await api.getReadings({
        page,
        limit: 10,
        patientId: patientIdParam,
      });
      setTableReadings(data.data || []);
      setTablePagination(data.pagination || null);
      setTablePage(page);
    } catch (err) {
      console.error('Error fetching readings:', err);
    } finally {
      setTableLoading(false);
    }
  }, [selectedPatientId, user]);

  // Initial & Dependency Fetch
  useEffect(() => {
    fetchReports();
    fetchTableReadings(1);
  }, [fetchReports, fetchTableReadings]);

  // Date Navigation Helpers
  const shiftDate = (days) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const newDate = `${y}-${m}-${d}`;
    if (newDate <= getTodayString()) {
      setSelectedDate(newDate);
    }
  };

  const handleOpenAddModal = (slotName = null) => {
    setEditingReading(null);
    setInitialSlot(slotName);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (reading) => {
    setEditingReading(reading);
    setInitialSlot(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (editingReading) {
      await api.updateReading(editingReading.id, formData);
    } else {
      await api.createReading(formData);
    }
    // Refresh both views
    await fetchReports();
    await fetchTableReadings(tablePage);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingReading) return;
    setIsDeleting(true);
    try {
      await api.deleteReading(deletingReading.id);
      setDeletingReading(null);
      await fetchReports();
      await fetchTableReadings(tablePage);
    } catch (err) {
      alert(err.message || 'Failed to delete reading');
    } finally {
      setIsDeleting(false);
    }
  };

  const dailyReadings = reports?.daily?.readings || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        onAddClick={() => handleOpenAddModal()}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 flex-1">
        {/* Top Control Bar: Doctor Patient Selector & Date Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Doctor Patient Selector (Bonus feature) */}
          {user?.role === 'doctor' && (
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <label htmlFor="patient-select" className="text-xs font-bold text-emerald-900">
                Viewing Patient:
              </label>
              <select
                id="patient-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="bg-white border border-emerald-300 text-slate-800 text-xs font-medium rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Picker & Quick Navigators */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              Report Date:
            </span>

            {/* Quick Today Button */}
            <button
              onClick={() => setSelectedDate(getTodayString())}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedDate === getTodayString()
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Today
            </button>

            {/* Prev Day Button */}
            <button
              onClick={() => shiftDate(-1)}
              title="Previous Day"
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Date Input */}
            <div className="relative">
              <input
                type="date"
                max={getTodayString()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-3 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>

            {/* Next Day Button */}
            <button
              onClick={() => shiftDate(1)}
              disabled={selectedDate >= getTodayString()}
              title="Next Day"
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => { fetchReports(); fetchTableReadings(tablePage); }}
              title="Refresh Reports"
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition ml-1"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. Report Cards (Daily, Month-to-date, Monthly) */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Glucose Summary Reports
            </h2>
            <p className="text-xs text-slate-400">
              Highest, lowest, and average blood glucose readings across key date ranges
            </p>
          </div>
          <ReportCards reports={reports} loading={reportsLoading} />
        </section>

        {/* 2. Daily Slot Breakdown (Lists each reading with its slot) */}
        <section>
          <DailyBreakdown
            readings={dailyReadings}
            selectedDate={selectedDate}
            onAddSlot={(slotName) => handleOpenAddModal(slotName)}
            onEditReading={(r) => handleOpenEditModal(r)}
            onDeleteReading={(r) => setDeletingReading(r)}
          />
        </section>

        {/* 3. Glucose Trend Chart (Recharts Bonus) */}
        <section>
          <GlucoseTrendChart
            readings={tableReadings}
            selectedMonthLabel={reports?.monthToDate?.dateRange || 'Recent Trend'}
          />
        </section>

        {/* 4. Complete History Log with Pagination */}
        <section>
          <ReadingsTable
            readings={tableReadings}
            pagination={tablePagination}
            onPageChange={(p) => fetchTableReadings(p)}
            onEditReading={(r) => handleOpenEditModal(r)}
            onDeleteReading={(r) => setDeletingReading(r)}
            loading={tableLoading}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>Sweety – Blood Glucose Tracker • Built with Node.js, Express, PostgreSQL & React</p>
      </footer>

      {/* Reading Form Modal */}
      <ReadingFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingReading}
        existingReadings={dailyReadings}
        selectedDate={selectedDate}
        initialSlot={initialSlot}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingReading}
        onCancel={() => setDeletingReading(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
