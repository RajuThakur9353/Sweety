import React from 'react';
import { Sun, Coffee, Utensils, Moon, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

const SLOT_CONFIG = {
  'Morning (fasting)': {
    icon: Sun,
    color: 'amber',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-600',
    target: '< 100 mg/dl',
    isFasting: true,
  },
  'After breakfast': {
    icon: Coffee,
    color: 'emerald',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    target: '< 140 mg/dl',
    isFasting: false,
  },
  'After lunch': {
    icon: Utensils,
    color: 'blue',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'text-blue-600',
    target: '< 140 mg/dl',
    isFasting: false,
  },
  'After dinner': {
    icon: Moon,
    color: 'indigo',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    iconColor: 'text-indigo-600',
    target: '< 140 mg/dl',
    isFasting: false,
  },
};

function getStatusBadge(val, isFasting) {
  if (isFasting) {
    if (val < 70) return { label: 'Low', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (val <= 99) return { label: 'Normal', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (val <= 125) return { label: 'Elevated', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { label: 'High', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
  } else {
    if (val < 70) return { label: 'Low', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (val < 140) return { label: 'Normal', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (val < 200) return { label: 'Elevated', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { label: 'High', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
  }
}

export default function DailyBreakdown({
  readings = [],
  selectedDate,
  onAddSlot,
  onEditReading,
  onDeleteReading,
}) {
  const slots = [
    'Morning (fasting)',
    'After breakfast',
    'After lunch',
    'After dinner',
  ];

  // Map readings by slot
  const readingMap = {};
  readings.forEach((r) => {
    readingMap[r.slot] = r;
  });

  const count = readings.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Daily Slot Breakdown</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
              {count} of 4 Recorded
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            4 daily recommended slots for {selectedDate}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center space-x-2">
          <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                count === 4 ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${(count / 4) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">{Math.round((count / 4) * 100)}%</span>
        </div>
      </div>

      {/* 4 Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {slots.map((slotName) => {
          const reading = readingMap[slotName];
          const config = SLOT_CONFIG[slotName];
          const Icon = config.icon;
          const status = reading ? getStatusBadge(reading.value, config.isFasting) : null;

          return (
            <div
              key={slotName}
              className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                reading
                  ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  : 'bg-white border-dashed border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Slot Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-xl ${config.bg} ${config.border} border flex items-center justify-center ${config.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{slotName}</span>
                  </div>
                  {reading && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${status.bg}`}>
                      {status.label}
                    </span>
                  )}
                </div>

                {/* Body: Value or Empty state */}
                {reading ? (
                  <div className="my-2">
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {reading.value}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">mg/dl</span>
                    </div>
                    {reading.notes && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 italic bg-white/80 p-2 rounded-lg border border-slate-100">
                        "{reading.notes}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="my-4 text-center">
                    <p className="text-xs text-slate-400">Not recorded yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Target: {config.target}</p>
                  </div>
                )}
              </div>

              {/* Slot Footer Actions */}
              <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
                {reading ? (
                  <>
                    <span className="text-[11px] text-slate-400">Target: {config.target}</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditReading(reading)}
                        title="Edit reading"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteReading(reading)}
                        title="Delete reading"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => onAddSlot(slotName)}
                    className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-transparent transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Record {slotName.split(' ')[0]}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
