import React, { useRef, useState, useEffect } from 'react';
import { X, Download, Send, CheckCircle2, XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toPng } from 'html-to-image';

interface SWOTData {
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
}

interface DayStats {
  day: string;
  total: number;
  completed: number;
  percentage: number;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  swot: SWOTData;
  employeeName: string;
  department: string;
  weekLabel: string;
  weekStart: string;
  dayStats: DayStats[];
  totalTasks: number;
  completedTasks: number;
}

export default function ReportModal({
  isOpen,
  onClose,
  swot,
  employeeName,
  department,
  weekLabel,
  weekStart,
  dayStats,
  totalTasks,
  completedTasks,
}: ReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    // Animation trigger
  }, [isOpen]);

  if (!isOpen) return null;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const bestDay = dayStats.length > 0 ? dayStats.reduce((a, b) => (a.percentage > b.percentage ? a : b), dayStats[0]) : null;
  const worstDay = dayStats.length > 0 ? dayStats.reduce((a, b) => (a.percentage < b.percentage ? a : b), dayStats[0]) : null;

  const handleDownload = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(reportRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `Weekly_Report_${employeeName.replace(/\s+/g, '_')}_${weekStart}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
    setIsExporting(false);
  };

  const handleSendToTelegram = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(reportRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const text = `Weekly Report: ${employeeName} — ${weekLabel}`;
      window.open(`https://t.me/share/url?url=${encodeURIComponent(dataUrl)}&text=${encodeURIComponent(text)}`, '_blank');
    } catch (err) {
      console.error('Export failed:', err);
    }
    setIsExporting(false);
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'emerald';
    if (rate >= 50) return 'amber';
    return 'rose';
  };

  const getDayAbbrev = (day: string) => day.slice(0, 3).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Weekly Performance Report</h2>
            <p className="text-slate-400 text-xs">
              Auto-generated analysis with SWOT and progress metrics
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Report content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <div ref={reportRef} className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Report Header */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-8 py-8">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Weekly Report</p>
                  <h1 className="text-2xl font-bold tracking-wide">{weekLabel}</h1>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs">Employee</p>
                  <p className="font-bold">{employeeName}</p>
                  {department && <p className="text-slate-300 text-sm">{department}</p>}
                </div>
              </div>
            </div>

            {/* Stats Hero */}
            <div className="border-b border-slate-200">
              <div className="grid grid-cols-3 divide-x divide-slate-200">
                <div className="p-6 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Completion Rate</p>
                  <div className="relative inline-block">
                    {/* Circular progress */}
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="35" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                      <circle
                        cx="40" cy="40" r="35" fill="none"
                        stroke={completionRate >= 80 ? '#10b981' : completionRate >= 50 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${completionRate * 2.2} 220`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-800">
                      {completionRate}%
                    </span>
                  </div>
                </div>
                <div className="p-6 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Tasks Completed</p>
                  <div className="text-4xl font-bold text-slate-800">
                    {completedTasks}<span className="text-slate-400 font-normal">/{totalTasks}</span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: totalTasks > 0 ? `${(completedTasks / totalTasks) * 100}%` : '0%',
                        backgroundColor: completionRate >= 80 ? '#10b981' : completionRate >= 50 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
                <div className="p-6 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Performance</p>
                  <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                    completionRate >= 80 ? 'text-emerald-600' : completionRate >= 50 ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {completionRate >= 80 ? (
                      <><TrendingUp size={22} /> Excellent</>
                    ) : completionRate >= 50 ? (
                      <><Minus size={22} /> Good</>
                    ) : (
                      <><TrendingDown size={22} /> Needs Work</>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {completionRate >= 80 ? 'Outstanding week!' : completionRate >= 50 ? 'Solid progress' : 'Room for improvement'}
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Progress Chart */}
            <div className="border-b border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Daily Progress Breakdown
              </h3>
              <div className="flex items-end justify-between gap-2 h-32 px-2">
                {dayStats.map((d, idx) => {
                  const height = d.total > 0 ? Math.max((d.percentage / 100) * 100, 8) : 8;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 group">
                      <div className="relative w-full h-28 flex items-end justify-center pb-2">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {d.completed}/{d.total}
                        </div>
                        <div
                          className="w-full max-w-10 rounded-t-lg transition-all relative overflow-hidden"
                          style={{
                            height: `${height}%`,
                            backgroundColor: d.percentage >= 80 ? '#10b981' : d.percentage >= 50 ? '#f59e0b' : '#ef4444',
                          }}
                        >
                          {d.total > 0 && d.completed > 0 && (
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-black/10"
                              style={{ height: `${(d.completed / d.total) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-600 mt-1">{getDayAbbrev(d.day)}</span>
                    </div>
                  );
                })}
              </div>
              {bestDay && worstDay && bestDay.day !== worstDay.day && (
                <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Best: {bestDay.day} ({bestDay.percentage}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Needs focus: {worstDay.day} ({worstDay.percentage}%)
                  </span>
                </div>
              )}
            </div>

            {/* SWOT Analysis */}
            <div className="p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                SWOT Analysis
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="border-l-4 border-emerald-500 bg-emerald-50 rounded-r-lg p-3">
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> Strengths
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {swot.strengths || '—'}
                  </p>
                </div>
                {/* Weaknesses */}
                <div className="border-l-4 border-rose-500 bg-rose-50 rounded-r-lg p-3">
                  <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                    <XCircle size={12} /> Weaknesses
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {swot.weaknesses || '—'}
                  </p>
                </div>
                {/* Opportunities */}
                <div className="border-l-4 border-sky-500 bg-sky-50 rounded-r-lg p-3">
                  <h4 className="text-xs font-bold text-sky-700 uppercase tracking-wide mb-1">
                    Opportunities
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {swot.opportunities || '—'}
                  </p>
                </div>
                {/* Threats */}
                <div className="border-l-4 border-amber-500 bg-amber-50 rounded-r-lg p-3">
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">
                    Threats
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {swot.threats || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-900 text-slate-400 text-center text-xs py-3 px-4">
              Generated by African Holding Groups — Weekly Planning System
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-semibold px-5 py-2 rounded-lg shadow transition-colors text-sm"
          >
            <Download size={15} />
            {isExporting ? 'Exporting...' : 'Download Image'}
          </button>
          
          <button
            onClick={handleSendToTelegram}
            disabled={isExporting}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold px-5 py-2 rounded-lg shadow transition-colors text-sm"
          >
            <Send size={15} />
            Send to Telegram
          </button>
        </div>
      </div>
    </div>
  );
}
