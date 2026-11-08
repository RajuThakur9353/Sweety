import React from 'react';
import { ChevronLeft, ChevronRight, Edit2, Trash2, Calendar, FileText } from 'lucide-react';

export default function ReadingsTable({
  readings = [],
  pagination = null,
  onPageChange,
  onEditReading,
  onDeleteReading,
  loading = false,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900">All Readings Log</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete reading history with server pagination (?page=1&limit=20)
          </p>
        </div>
        {pagination && (
          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            Total {pagination.total} records
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-6">Date</th>
              <th className="py-3 px-6">Slot</th>
              <th className="py-3 px-6">Glucose Value</th>
              <th className="py-3 px-6">Notes</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400 text-sm">
                  Loading readings...
                </td>
              </tr>
            ) : readings.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400 text-sm">
                  No readings found in this view.
                </td>
              </tr>
            ) : (
              readings.map((r) => {
                const isHigh = r.value >= 180;
                const isLow = r.value < 70;

                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-6 font-medium text-slate-800 whitespace-nowrap flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {r.reading_date}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-700 whitespace-nowrap">
                      {r.slot}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                        isHigh
                          ? 'bg-rose-100 text-rose-800'
                          : isLow
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {r.value} mg/dl
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-500 max-w-xs truncate">
                      {r.notes ? (
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{r.notes}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">–</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onEditReading(r)}
                          title="Edit reading"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteReading(r)}
                          title="Delete reading"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer (Bonus feature) */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Page <span className="font-bold text-slate-800">{pagination.page}</span> of{' '}
            <span className="font-bold text-slate-800">{pagination.totalPages}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
