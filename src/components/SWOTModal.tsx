import React, { useState } from 'react';
import { X, Lightbulb, Target, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface SWOTModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (swot: { strengths: string; weaknesses: string; opportunities: string; threats: string }) => void;
  employeeName: string;
  weekLabel: string;
}

export default function SWOTModal({ isOpen, onClose, onSubmit, employeeName, weekLabel }: SWOTModalProps) {
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [opportunities, setOpportunities] = useState('');
  const [threats, setThreats] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ strengths, weaknesses, opportunities, threats });
    onClose();
  };

  const fields: { key: 'strengths' | 'weaknesses' | 'opportunities' | 'threats'; label: string; icon: React.ReactNode; color: string; placeholder: string; value: string; setter: (v: string) => void }[] = [
    {
      key: 'strengths',
      label: 'Strengths',
      icon: <ShieldCheck size={18} />,
      color: 'emerald',
      placeholder: 'What went well this week? Your key achievements...',
      value: strengths,
      setter: setStrengths,
    },
    {
      key: 'weaknesses',
      label: 'Weaknesses',
      icon: <AlertTriangle size={18} />,
      color: 'rose',
      placeholder: 'What challenges did you face? Areas for improvement...',
      value: weaknesses,
      setter: setWeaknesses,
    },
    {
      key: 'opportunities',
      label: 'Opportunities',
      icon: <Lightbulb size={18} />,
      color: 'sky',
      placeholder: 'What opportunities can you leverage next week?',
      value: opportunities,
      setter: setOpportunities,
    },
    {
      key: 'threats',
      label: 'Threats',
      icon: <Target size={18} />,
      color: 'amber',
      placeholder: 'What risks or obstacles might affect your progress?',
      value: threats,
      setter: setThreats,
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; focus: string }> = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', focus: 'focus:ring-emerald-500 focus:border-emerald-500' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', focus: 'focus:ring-rose-500 focus:border-rose-500' },
    sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', focus: 'focus:ring-sky-500 focus:border-sky-500' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', focus: 'focus:ring-amber-500 focus:border-amber-500' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap size={20} className="text-amber-400" />
              Weekly SWOT Analysis
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              {employeeName} — {weekLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-slate-600 mb-5">
            Complete your SWOT analysis for this week. This will be included in your weekly report along with your progress metrics.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((field) => {
              const colors = colorMap[field.color];
              return (
                <div key={field.key} className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-4`}>
                  <label className={`flex items-center gap-2 text-sm font-bold ${colors.text} mb-2`}>
                    {field.icon}
                    {field.label}
                  </label>
                  <textarea
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    className={`w-full h-28 px-3 py-2 text-sm rounded-lg border ${colors.border} ${colors.focus} resize-none`}
                    placeholder={field.placeholder}
                  />
                </div>
              );
            })}
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md transition-all text-sm"
          >
            <Zap size={16} />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}
