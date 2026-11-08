import React from 'react';
import { Calendar, TrendingUp, TrendingDown, Layers, FileQuestion, Sparkles } from 'lucide-react';

function ReportCard({ title, dateRange, stats, badgeColor = 'blue', subtitle }) {
  const { hasData, highest, lowest, average, count } = stats || {
    hasData: false,
    highest: null,
    lowest: null,
    average: null,
    count: 0,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:shadow-md transition flex flex-col justify-between relative overflow-hidden">
      {/* Top Banner accent */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
        badgeColor === 'rose' ? 'bg-rose-500' :
        badgeColor === 'emerald' ? 'bg-emerald-500' :
        'bg-indigo-500'
      }`} />

      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-base font-bold text-slate-900">{title}</h4>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                badgeColor === 'rose' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                badgeColor === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}>
                {count} {count === 1 ? 'Reading' : 'Readings'}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {dateRange}
            </p>
          </div>
        </div>

        {/* Content or Friendly Empty State */}
        {!hasData || count === 0 ? (
          <div className="py-8 px-4 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200 my-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <FileQuestion className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No readings recorded</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
              There are no glucose readings logged for this period.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 my-3">
            {/* Average */}
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-center">
              <div className="text-[11px] font-medium text-slate-500 mb-0.5 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" /> Average
              </div>
              <div className="text-xl font-extrabold text-slate-900">
                {average !== null ? Number(average).toFixed(1) : '–'}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">mg/dl</div>
            </div>

            {/* Highest */}
            <div className="bg-rose-50/50 rounded-xl p-3 border border-rose-100/70 text-center">
              <div className="text-[11px] font-medium text-rose-700 mb-0.5 flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-rose-500" /> Highest
              </div>
              <div className="text-xl font-extrabold text-rose-700">
                {highest !== null ? highest : '–'}
              </div>
              <div className="text-[10px] text-rose-400 font-semibold">mg/dl</div>
            </div>

            {/* Lowest */}
            <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/70 text-center">
              <div className="text-[11px] font-medium text-emerald-700 mb-0.5 flex items-center justify-center gap-1">
                <TrendingDown className="w-3 h-3 text-emerald-500" /> Lowest
              </div>
              <div className="text-xl font-extrabold text-emerald-700">
                {lowest !== null ? lowest : '–'}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold">mg/dl</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Target: 70–140 mg/dl</span>
        <span className="font-medium text-slate-500">{subtitle}</span>
      </div>
    </div>
  );
}

export default function ReportCards({ reports, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-56 bg-slate-200/70 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  const { daily, monthToDate, monthly } = reports || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ReportCard
        title="Daily Report"
        dateRange={daily?.dateRange || 'Selected date'}
        stats={daily}
        badgeColor="rose"
        subtitle="Selected Day"
      />
      <ReportCard
        title="Month-to-date"
        dateRange={monthToDate?.dateRange || '1st to selected'}
        stats={monthToDate}
        badgeColor="indigo"
        subtitle="Current Month"
      />
      <ReportCard
        title="Monthly"
        dateRange={monthly?.dateRange || 'Previous Month'}
        stats={monthly}
        badgeColor="emerald"
        subtitle="Previous Month"
      />
    </div>
  );
}
