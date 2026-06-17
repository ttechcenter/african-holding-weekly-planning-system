import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlanItem } from '../types';
import {
  Printer,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface WeeklyPlanTableProps {
  items: PlanItem[];
  weekStart: string;
  employeeName: string;
  department?: string;
  readOnly?: boolean;
  onItemChange?: (id: string, field: keyof PlanItem, value: string | boolean) => void;
  onToggleComplete?: (id: string, value: boolean) => void;
}

const DATA_COLS: { key: keyof PlanItem; label: string }[] = [
  { key: 'a_epie', label: 'A>EPIE' },
  { key: 'preparation', label: 'Preparation' },
  { key: 'principle', label: 'Principle' },
  { key: 'plan_col', label: 'Plan' },
  { key: 'perform', label: 'Perform' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'profit_impl', label: 'Profit (Impl)' },
  { key: 'pragmatism', label: 'Pragmatism' },
  { key: 'persistence', label: 'Persistence' },
  { key: 'profit_eval', label: 'Profit (Eval)' },
];

export function formatWeekRange(weekStart: string) {
  const start = new Date(weekStart + 'T00:00:00');
    const end = new Date(weekStart + 'T00:00:00');
      end.setDate(end.getDate() + 6);
        const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
          return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', {
              ...opts,
                  year: 'numeric',
                    })}`;
                    }

function formatFullDate(weekStart: string) {
  const d = new Date(weekStart + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getDayDate(weekStart: string, dayIndex: number): string {
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() + dayIndex);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const DAY_INDEX: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
};

export function formatPlanAsText(
  items: PlanItem[],
  weekStart: string,
  employeeName: string,
  department: string = ''
): string {
  const days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  let output = '';

  output += 'AFRICAN HOLDING GROUPS\n';
  output += 'WEEKLY PLAN REPORT\n';
  output += '========================================\n\n';

  output += `Employee: ${employeeName}\n`;
  output += `Department: ${department}\n`;
  output += `Week: ${formatWeekRange(weekStart)}\n`;
  output += '\n';

  days.forEach((day) => {
    const dayItems = items
      .filter((item) => item.day_of_week === day)
      .sort((a, b) => a.s_no - b.s_no);

    if (dayItems.length === 0) return;

    output += `\n${day.toUpperCase()}\n`;
    output += '----------------------------------------\n';

    dayItems.forEach((item) => {
      output += `\nTask #${item.s_no}\n`;
      output += `Status: ${
        item.is_completed ? 'Completed' : 'Pending'
      }\n`;

      if (item.a_epie)
        output += `A>EPIE: ${item.a_epie}\n`;

      if (item.preparation)
        output += `Preparation: ${item.preparation}\n`;

      if (item.principle)
        output += `Principle: ${item.principle}\n`;

      if (item.plan_col)
        output += `Plan: ${item.plan_col}\n`;

      if (item.perform)
        output += `Perform: ${item.perform}\n`;

      if (item.productivity)
        output += `Productivity: ${item.productivity}\n`;

      if (item.profit_impl)
        output += `Profit (Implementation): ${item.profit_impl}\n`;

      if (item.pragmatism)
        output += `Pragmatism: ${item.pragmatism}\n`;

      if (item.persistence)
        output += `Persistence: ${item.persistence}\n`;

      if (item.profit_eval)
        output += `Profit (Evaluation): ${item.profit_eval}\n`;

      output += '\n';
    });
  });

  const totalTasks = items.length;
  const completedTasks = items.filter(
    (item) => item.is_completed
  ).length;

  output += '\n========================================\n';
  output += `Total Tasks: ${totalTasks}\n`;
  output += `Completed Tasks: ${completedTasks}\n`;
  output += `Pending Tasks: ${totalTasks - completedTasks}\n`;
  output += `Completion Rate: ${
    totalTasks
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0
  }%\n`;
  output += '========================================\n';

  return output;
}

export default function WeeklyPlanTable({
  items,
  weekStart,
  employeeName,
  department,
  readOnly = false,
  onItemChange,
  onToggleComplete,
}: WeeklyPlanTableProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [expandedMobileRows, setExpandedMobileRows] = useState<Record<string, boolean>>({});

  const pages = Array.from(new Set(items.map((i) => i.page_num))).sort((a, b) => a - b);
  const [currentPage, setCurrentPage] = useState(pages ?? 1);

 const validPage =
  pages.includes(currentPage)
    ? currentPage
    : pages.length > 0
      ? pages[0]
      : 1;
  const pageItems = items.filter((i) => i.page_num === validPage);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const grouped = days.map((day) => ({
    day,
    rows: pageItems.filter((i) => i.day_of_week === day).sort((a, b) => a.s_no - b.s_no),
  }));

  const completedCount = items.filter((i) => i.is_completed).length;
  const totalCount = items.length;

  const toggleMobileRow = (id: string) => {
    setExpandedMobileRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank', 'width=1400,height=900');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Weekly Plan - ${employeeName}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:Arial,sans-serif;font-size:10px;}
        .pw{padding:12px;}
        table{width:100%;border-collapse:collapse;}
        th,td{border:1px solid #444;padding:3px 5px;text-align:left;vertical-align:middle;}
        .h1{background:#2e5c10;color:#fff;font-weight:bold;text-align:center;}
        .h2{background:#4a7c2f;color:#fff;font-weight:bold;text-align:center;}
        .h3{background:#d4a017;color:#111;font-weight:bold;text-align:center;}
        .day-hdr{background:#e65100;color:#fff;font-weight:bold;font-size:11px;}
        .sat-hdr{background:#1b5e20;color:#fff;font-weight:bold;font-size:11px;}
      </style></head><body><div class="pw">${printContents}</div>
      <script>window.onload=()=>{window.print();window.close();}</script>
      </body></html>`);
    win.document.close();
  };

  
  return (
    <div className="w-full bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      {/* Action / Progress Bar */}
      {!readOnly && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50/70 no-print">
          <div className="flex items-center justify-between sm:justify-start gap-3 text-sm text-gray-600 w-full sm:w-auto">
            <div>
              <span className="font-semibold text-gray-900">{completedCount}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalCount}</span> tasks completed
            </div>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              {/* Animated Progress Fill */}
              <motion.div
                className="h-full bg-green-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: totalCount ? `${(completedCount / totalCount) * 100}%` : '0%' }}
                transition={{ type: 'spring', stiffness: 80, damping: 15 }}
              />
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm w-full sm:w-auto"
          >
            <Printer size={15} />
            Download / Print
          </motion.button>
        </div>
      )}

      {/* Pagination controls */}
      {pages.length > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-orange-50/60 border-b border-orange-100 no-print">
          <button
            onClick={() => {
              const idx = pages.indexOf(validPage);
              if (idx > 0) setCurrentPage(pages[idx - 1]);
            }}
            disabled={pages.indexOf(validPage) === 0}
            className="flex items-center gap-1 text-xs font-semibold text-orange-700 hover:text-orange-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors py-1 px-2 rounded hover:bg-orange-100/50"
          >
            <ChevronLeft size={16} />
            Prev
          </button>
          <span className="text-xs font-bold text-gray-700 bg-orange-100 text-orange-800 px-2.5 py-1 rounded-full">
            Page {validPage} of {pages.length}
          </span>
          <button
            onClick={() => {
              const idx = pages.indexOf(validPage);
              if (idx < pages.length - 1) setCurrentPage(pages[idx + 1]);
            }}
            disabled={pages.indexOf(validPage) === pages.length - 1}
            className="flex items-center gap-1 text-xs font-semibold text-orange-700 hover:text-orange-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors py-1 px-2 rounded hover:bg-orange-100/50"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Corporate Metadata Header */}
      <div className="w-full">
        <div className="bg-green-900 text-white text-center py-4 px-4">
          <h2 className="text-lg md:text-xl font-bold tracking-widest uppercase">African Holding Groups</h2>
          <p className="text-orange-400 font-bold text-xs md:text-sm tracking-wide mt-0.5">Weekly Plan Matrix</p>
        </div>

        <div className="bg-orange-500 text-white px-4 py-3 grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap gap-x-6 gap-y-2 text-xs font-medium">
          <div><span className="opacity-80 font-normal">Employee:</span> {employeeName}</div>
          {department && <div><span className="opacity-80 font-normal">Department:</span> {department}</div>}
          <div><span className="opacity-80 font-normal">Week Range:</span> {formatWeekRange(weekStart)}</div>
          <div><span className="opacity-80 font-normal">Base Date:</span> {formatFullDate(weekStart)}</div>
        </div>
      </div>

      {/* 1. MOBILE ACCORDION CARD VIEW (Animated) */}
      <div className="block md:hidden bg-gray-50 p-2 space-y-4 no-print">
        {grouped.map(({ day, rows }) => {
          const isSaturday = day === 'Saturday';
          const dayDate = getDayDate(weekStart, DAY_INDEX[day]);
          const dayHeaderBg = isSaturday ? 'bg-green-800' : 'bg-orange-600';

          return (
            <div key={day} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className={`${dayHeaderBg} text-white px-3 py-2 flex justify-between items-center text-xs font-bold`}>
                <span>{isSaturday ? `SATURDAY — Reporting & Review` : day.toUpperCase()}</span>
                <span className="opacity-90 font-mono text-[11px]">{dayDate}</span>
              </div>

              <div className="divide-y divide-gray-100">
                {rows.length === 0 ? (
                  <div className="p-4 text-center text-xs italic text-gray-400">No tasks planned</div>
                ) : (
                  rows.map((item) => {
                    const isExpanded = !!expandedMobileRows[item.id];
                    return (
                      <div key={item.id} className={`p-3 transition-colors duration-200 ${item.is_completed ? 'bg-green-50/40' : 'bg-white'}`}>
                        <div className="flex items-start gap-2.5">
                          <div className="pt-0.5">
                            {readOnly ? (
                              item.is_completed ? (
                                <CheckSquare size={16} className="text-green-600" />
                              ) : (
                                <Square size={16} className="text-gray-400" />
                              )
                            ) : (
                              <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => onToggleComplete?.(item.id, !item.is_completed)}
                                className="text-green-600 hover:text-green-800 focus:outline-none block"
                              >
                                {item.is_completed ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-400" />}
                              </motion.button>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleMobileRow(item.id)}>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-600 text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                S/No {item.s_no}
                              </span>
                              <span className="text-[11px] font-medium text-gray-500 truncate max-w-[180px]">
                                {item.a_epie ? `A>EPIE: ${item.a_epie}` : 'No Master Title'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 mt-1 font-normal line-clamp-1">
                              <span className="font-medium text-gray-400">Plan Preview:</span> {item.plan_col || '—'}
                            </p>
                          </div>

                          <motion.button
                            onClick={() => toggleMobileRow(item.id)}
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-gray-400 p-1 hover:bg-gray-100 rounded self-start"
                          >
                            <ChevronDown size={16} />
                          </motion.button>
                        </div>

                        {/* Animated Dropdown Accordion Section */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-dashed border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-gray-50 p-2.5 rounded-md">
                                {DATA_COLS.map(({ key, label }) => (
                                  <div key={key} className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</label>
                                    {readOnly ? (
                                      <div className={`text-xs p-1.5 bg-white border border-gray-100 rounded ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                        {(item[key] as string) || '—'}
                                      </div>
                                    ) : (
                                      <input
                                        type="text"
                                        value={(item[key] as string) || ''}
                                        onChange={(e) => onItemChange?.(item.id, key, e.target.value)}
                                        className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 rounded transition-all shadow-sm text-gray-800"
                                        placeholder={`Enter ${label}...`}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. DESKTOP MATRICES VIEW (Animated Transitions across pages) */}
      <div ref={printRef} className="hidden md:block overflow-x-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={validPage}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
          >
            <table className="w-full border-collapse text-xs table-fixed" style={{ minWidth: '1024px' }}>
              <thead>
                <tr>
                  <th rowSpan={2} className="border border-gray-400 p-2 text-center font-bold text-white w-8" style={{ backgroundColor: '#2e5c10' }}>✓</th>
                  <th rowSpan={2} className="border border-gray-400 p-2 text-center font-bold text-white w-12" style={{ backgroundColor: '#2e5c10' }}>S/No</th>
                  <th rowSpan={2} className="border border-gray-400 p-2 text-center font-bold text-white w-16" style={{ backgroundColor: '#2e5c10' }}>Day</th>
                  <th rowSpan={2} className="border border-gray-400 p-2 text-center font-bold text-white w-28" style={{ backgroundColor: '#2e5c10' }}>A&gt;EPIE</th>
                  <th colSpan={3} className="border border-gray-400 p-1.5 text-center font-bold text-white" style={{ backgroundColor: '#4a7c2f' }}>Preparation</th>
                  <th colSpan={3} className="border border-gray-400 p-1.5 text-center font-bold text-white" style={{ backgroundColor: '#4a7c2f' }}>Implementation</th>
                  <th colSpan={3} className="border border-gray-400 p-1.5 text-center font-bold text-white" style={{ backgroundColor: '#4a7c2f' }}>Evaluation</th>
                </tr>
                <tr>
                  {['Preparation', 'Principle', 'Plan', 'Perform', 'Productivity', 'Profit', 'Pragmatism', 'Persistence', 'Profit'].map((label, i) => (
                    <th key={i} className="border border-gray-400 p-1 text-center font-semibold text-gray-900 text-[11px]" style={{ backgroundColor: '#d4a017' }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grouped.map(({ day, rows }) => {
                  const isSaturday = day === 'Saturday';
                  const dayDate = getDayDate(weekStart, DAY_INDEX[day]);
                  const dayHeaderBg = isSaturday ? '#1b5e20' : '#e65100';

                  return (
                    <React.Fragment key={day}>
                      <tr>
                        <td colSpan={13} className="border border-gray-400 px-3 py-1.5 font-bold text-white" style={{ backgroundColor: dayHeaderBg }}>
                          {isSaturday ? `SATURDAY — Reporting & Review` : `${day.toUpperCase()}`}
                          <span className="ml-3 font-normal opacity-85">{dayDate}</span>
                        </td>
                      </tr>

                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="border border-gray-200 px-3 py-3 text-gray-400 italic text-center">
                            No tasks planned for {day}
                          </td>
                        </tr>
                      ) : (
                        rows.map((item, rowIdx) => (
                          <tr
                            key={item.id}
                            className={`transition-colors duration-200 ${
                              item.is_completed ? 'bg-green-50' : rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'
                            }`}
                          >
                            <td className="border border-gray-200 p-1 text-center">
                              {readOnly ? (
                                item.is_completed ? (
                                  <CheckSquare size={14} className="text-green-600 mx-auto" />
                                ) : (
                                  <Square size={14} className="text-gray-300 mx-auto" />
                                )
                              ) : (
                                <motion.button
                                  whileTap={{ scale: 0.8 }}
                                  onClick={() => onToggleComplete?.(item.id, !item.is_completed)}
                                  className="text-green-600 hover:text-green-800 transition-colors mx-auto block"
                                >
                                  {item.is_completed ? <CheckSquare size={15} /> : <Square size={15} className="text-gray-400" />}
                                </motion.button>
                              )}
                            </td>

                            <td className="border border-gray-200 p-1 text-center text-gray-500 font-bold">{item.s_no}</td>

                            <td className="border border-gray-200 p-1 text-center">
                              <span className={`inline-block font-bold text-[10px] px-1.5 py-0.5 rounded ${isSaturday ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                {day.slice(0, 3)}
                              </span>
                            </td>

                            {DATA_COLS.map(({ key }) => (
                              <td key={key} className="border border-gray-200 p-0.5">
                                {readOnly ? (
                                  <span className={`text-xs px-1 block truncate max-w-[150px] ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                    {(item[key] as string) || ''}
                                  </span>
                                ) : (
                                  <input
                                    type="text"
                                    value={(item[key] as string) || ''}
                                    onChange={(e) => onItemChange?.(item.id, key, e.target.value)}
                                    className="w-full text-xs px-1 py-1 bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-green-400 rounded transition-colors text-gray-800"
                                  />
                                )}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="bg-green-900 text-green-300 text-center text-[10px] md:text-xs py-2.5 px-4 font-mono tracking-wider">
        African Holding Groups &mdash; Internal Use Only &mdash; Confidential Document
      </div>
    </div>
  );
}