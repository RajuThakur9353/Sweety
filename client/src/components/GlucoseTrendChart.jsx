import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl border border-slate-700 space-y-1">
        <p className="font-bold text-slate-200">{data.date} • {data.slot}</p>
        <p className="text-rose-400 text-base font-extrabold">{data.value} mg/dl</p>
        {data.notes && <p className="text-slate-400 italic">"{data.notes}"</p>}
      </div>
    );
  }
  return null;
}

export default function GlucoseTrendChart({ readings = [], selectedMonthLabel = 'Month-to-date' }) {
  if (!readings || readings.length === 0) {
    return null;
  }

  // Format readings for line chart
  const chartData = readings.map((r) => ({
    date: r.reading_date ? r.reading_date.slice(5) : '', // 'MM-DD'
    fullDate: r.reading_date,
    slot: r.slot,
    value: r.value,
    notes: r.notes,
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-500" />
            <span>Glucose Trends ({selectedMonthLabel})</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Target normal zone is highlighted between 70 and 140 mg/dl
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs font-medium text-slate-500">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-rose-500 rounded-full" />
            <span>Readings (mg/dl)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500" />
            <span>Normal Zone (70–140)</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              domain={[40, 300]}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Target Normal Zone Lines */}
            <ReferenceLine y={140} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Post-Meal Max (140)', position: 'insideTopRight', fill: '#10b981', fontSize: 10 }} />
            <ReferenceLine y={70} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: 'Low Threshold (70)', position: 'insideBottomRight', fill: '#3b82f6', fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#e11d48"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#e11d48' }}
              activeDot={{ r: 6, fill: '#e11d48', stroke: '#ffe4e6', strokeWidth: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
