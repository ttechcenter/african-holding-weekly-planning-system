import React, { useState, useRef } from 'react';
import { PlanItem } from '../types';
import {
  Printer,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
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

const ROWS_PER_PAGE = 6;

const DATA_COLS: { key: keyof PlanItem; label: string }[] = [
  { key: 'a_epie', label: 'A>EPIE' },
  { key: 'preparation', label: 'preparation' },
  { key: 'principle', label: 'Principle' },
  { key: 'plan_col', label: 'Plan' },
  { key: 'perform', label: 'Perform' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'profit_impl', label: 'Profit' },
  { key: 'pragmatism', label: 'Pragmatism' },
  { key: 'persistence', label: 'Persistence' },
  { key: 'profit_eval', label: 'Profit' },
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
  department?: string
): string {
  const lines: string[] = [
    '🌍 AFRICAN HOLDING GROUPS',
    '📋 WEEKLY PLAN',
    '',
    `👤 Employee: ${employeeName}`,
    ...(department ? [`🏢 Department: ${department}`] : []),
    `📅 Week: ${formatWeekRange(weekStart)}`,
    `📆 Date: ${formatFullDate(weekStart)}`,
    '',
    '═══════════════════════════════════',
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const pages = Array.from(new Set(items.map((i) => i.page_num))).sort((a, b) => a - b);

  for (const page of pages) {
    if (pages.length > 1) {
      lines.push('', `📄 PAGE ${page}`, '───────────────────────────────────');
    }
    for (const day of days) {
      const dayItems = items
        .filter((i) => i.page_num === page && i.day_of_week === day)
        .sort((a, b) => a.s_no - b.s_no);
      if (dayItems.length === 0) continue;

      const isSat = day === 'Saturday';
      const dayDate = getDayDate(weekStart, DAY_INDEX[day]);
      lines.push('');
      lines.push(
        isSat
          ? `📌 SATURDAY (${dayDate}) — Reporting & Review`
          : `📌 ${day.toUpperCase()} (${dayDate})`
      );
      lines.push('─'.repeat(40));

      for (const item of dayItems) {
        const status = item.is_completed ? '✅' : '⬜';
        lines.push(`${status} #${item.s_no}`);
        if (item.a_epie) lines.push(`   A>EPIE: ${item.a_epie}`);
        const prep = [item.preparation, item.principle, item.plan_col].filter(Boolean);
        if (prep.length) lines.push(`   Preparation: ${prep.join(' | ')}`);
        const impl = [item.perform, item.productivity, item.profit_impl].filter(Boolean);
        if (impl.length) lines.push(`   Implementation: ${impl.join(' | ')}`);
        const ev = [item.pragmatism, item.persistence, item.profit_eval].filter(Boolean);
        if (ev.length) lines.push(`   Evaluation: ${ev.join(' | ')}`);
      }
    }
  }

  lines.push('', '═══════════════════════════════════');
  const completed = items.filter((i) => i.is_completed).length;
  lines.push(`Progress: ${completed}/${items.length} tasks completed`);
  lines.push('African Holding Groups — Internal Use Only');
  return lines.join('\n');
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

  // Unique pages across items
  const pages = Array.from(new Set(items.map((i) => i.page_num))).sort((a, b) => a - b);
  const [currentPage, setCurrentPage] = useState(pages[0] ?? 1);

  // Keep currentPage in sync if pages change
  const validPage = pages.includes(currentPage) ? currentPage : pages[0] ?? 1;
  const pageItems = items.filter((i) => i.page_num === validPage);

  // Group by day so we can render each day's rows together
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const grouped = days.map((day) => ({
    day,
    rows: pageItems.filter((i) => i.day_of_week === day).sort((a, b) => a.s_no - b.s_no),
  }));

  const completedCount = items.filter((i) => i.is_completed).length;
  const totalCount = items.length;

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
        .even{background:#f9f9f9;} .done{background:#e8f5e9;}
        .title{text-align:center;margin-bottom:10px;}
        .title h1{font-size:18px;font-weight:bold;color:#1b5e20;}
        .title h2{font-size:12px;color:#e65100;}
        img.hi{width:100%;max-height:75px;object-fit:cover;margin-bottom:6px;}
      </style></head><body><div class="pw">${printContents}</div>
      <script>window.onload=()=>{window.print();window.close();}</script>
      </body></html>`);
    win.document.close();
  };

  return (
    <div>
      {/* Print button */}
      {!readOnly && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 no-print bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{completedCount}</span> of{' '}
            <span className="font-medium">{totalCount}</span> tasks completed
            <div className="ml-2 w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: totalCount ? `${(completedCount / totalCount) * 100}%` : '0%' }}
              />
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Printer size={14} />
            Download / Print
          </button>
        </div>
      )}

      {/* Pagination controls */}
      {pages.length > 1 && (
        <div className="flex items-center justify-center gap-3 py-2 bg-orange-50 border-b border-orange-100 no-print">
          <button
            onClick={() => {
              const idx = pages.indexOf(validPage);
              if (idx > 0) setCurrentPage(pages[idx - 1]);
            }}
            disabled={pages.indexOf(validPage) === 0}
            className="flex items-center gap-1 text-sm font-medium text-orange-700 hover:text-orange-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-lg hover:bg-orange-100 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={16} />
            Prev Page
          </button>
          <span className="text-sm font-semibold text-gray-700">
            Page {validPage} of {pages.length}
          </span>
          <button
            onClick={() => {
              const idx = pages.indexOf(validPage);
              if (idx < pages.length - 1) setCurrentPage(pages[idx + 1]);
            }}
            disabled={pages.indexOf(validPage) === pages.length - 1}
            className="flex items-center gap-1 text-sm font-medium text-orange-700 hover:text-orange-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-lg hover:bg-orange-100 disabled:hover:bg-transparent"
          >
            Next Page
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Printable content */}
      <div ref={printRef} className="overflow-x-auto">
        {/* Header image */}
        <img
  src="/logo.png"
  alt="African Holding Groups"
  className="w-20 object-cover mx-auto"
  style={{ maxHeight: '90px' }}
/>

        {/* Brand header */}
        <div className="bg-green-900 text-white text-center py-3 px-4">
          <h2 className="text-xl font-bold tracking-widest uppercase">African Holding Groups</h2>
          <p className="text-orange-300 font-semibold text-sm tracking-wide mt-0.5">Weekly Plan</p>
        </div>

        {/* Meta bar */}
        <div className="bg-orange-500 text-white px-4 py-2 flex flex-wrap gap-x-6 gap-y-1 text-xs">
          <span><span className="font-bold">Employee:</span> {employeeName}</span>
          {department && <span><span className="font-bold">Department:</span> {department}</span>}
          <span><span className="font-bold">Week:</span> {formatWeekRange(weekStart)}</span>
          <span><span className="font-bold">Date:</span> {formatFullDate(weekStart)}</span>
          {pages.length > 1 && <span><span className="font-bold">Page:</span> {validPage} / {pages.length}</span>}
        </div>

        {/* Table */}
        <table
          className="w-full border-collapse text-xs"
          style={{ minWidth: '980px' }}
        >
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="border border-gray-600 px-1.5 py-2 text-center font-bold text-white text-xs"
                style={{ backgroundColor: '#2e5c10', width: '28px' }}
              >
                ✓
              </th>
              <th
                rowSpan={2}
                className="border border-gray-600 px-1.5 py-2 text-center font-bold text-white text-xs"
                style={{ backgroundColor: '#2e5c10', width: '32px' }}
              >
                S/No
              </th>
              <th
                rowSpan={2}
                className="border border-gray-600 px-1.5 py-2 text-center font-bold text-white text-xs"
                style={{ backgroundColor: '#2e5c10', width: '90px' }}
              >
                Day
              </th>
              <th
                rowSpan={2}
                className="border border-gray-600 px-1.5 py-2 text-center font-bold text-white text-xs"
                style={{ backgroundColor: '#2e5c10', width: '78px' }}
              >
                A&gt;EPIE
              </th>
              <th
                colSpan={3}
                className="border border-gray-600 px-2 py-2 text-center font-bold text-white text-xs"
                style={{ backgroundColor: '#4a7c2f' }}
              >
                Preparation
              </th>
              <th
                colSpan={3}
                className="border border-gray-600 px-2 py-2 text-center font-bold text-white text-xs"
                style={{ backgroundColor: '#4a7c2f' }}
              >
                Implementation
              </th>
              <th
                colSpan={3}
                className="border border-gray-600 px-2 py-2 text-center font-bold text-white text-xs"
                style={{ backgroundColor: '#4a7c2f' }}
              >
                Evaluation
              </th>
            </tr>
            <tr>
              {['Preparation', 'Principle', 'Plan', 'Perform', 'Productivity', 'Profit', 'Pragmatism', 'Persistence', 'Profit'].map(
                (label, i) => (
                  <th
                    key={i}
                    className="border border-gray-600 px-1.5 py-1.5 text-center font-semibold text-gray-900 text-xs"
                    style={{ backgroundColor: '#d4a017' }}
                  >
                    {label}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {grouped.map(({ day, rows }) => {
              const isSaturday = day === 'Saturday';
              const dayDate = getDayDate(weekStart, DAY_INDEX[day]);
              const dayHeaderBg = isSaturday ? '#1b5e20' : '#e65100';

              return (
                <React.Fragment key={day}>
                  {/* Day section header */}
                  <tr>
                    <td
                      colSpan={13}
                      className="border border-gray-600 px-3 py-1.5 font-bold text-white text-xs"
                      style={{ backgroundColor: dayHeaderBg }}
                    >
                      {isSaturday ? `SATURDAY — Reporting & Review` : `${day.toUpperCase()}`}
                      <span className="ml-3 font-normal opacity-80 text-xs">{dayDate}</span>
                      {isSaturday && (
                        <span className="ml-3 text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full">
                          Weekly Reporting Day
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Task rows for this day */}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="border border-gray-200 px-3 py-2 text-gray-400 text-xs italic text-center">
                        No tasks for {day}
                      </td>
                    </tr>
                  ) : (
                    rows.map((item, rowIdx) => (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          item.is_completed
                            ? 'bg-green-50'
                            : rowIdx % 2 === 0
                            ? 'bg-white'
                            : 'bg-gray-50'
                        } ${isSaturday ? 'border-l-2 border-green-600' : ''}`}
                      >
                        {/* Checkbox */}
                        <td className="border border-gray-200 px-1 py-1 text-center">
                          {readOnly ? (
                            item.is_completed ? (
                              <CheckSquare size={13} className="text-green-600 mx-auto" />
                            ) : (
                              <Square size={13} className="text-gray-400 mx-auto" />
                            )
                          ) : (
                            <button
                              onClick={() => onToggleComplete?.(item.id, !item.is_completed)}
                              className="text-green-600 hover:text-green-800 transition-colors mx-auto block"
                              title={item.is_completed ? 'Mark incomplete' : 'Mark complete'}
                            >
                              {item.is_completed ? (
                                <CheckSquare size={15} />
                              ) : (
                                <Square size={15} className="text-gray-400" />
                              )}
                            </button>
                          )}
                        </td>

                        {/* S/No */}
                        <td className="border border-gray-200 px-1.5 py-1 text-center text-gray-500 font-medium text-xs">
                          {item.s_no}
                        </td>

                        {/* Day label */}
                        <td className="border border-gray-200 px-1.5 py-1 text-center">
                          <span
                            className={`inline-block text-xs font-semibold px-1.5 py-0.5 rounded ${
                              isSaturday
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {day.slice(0, 3)}
                          </span>
                        </td>

                        {/* A>EPIE + data cols */}
                        {DATA_COLS.slice(0).map(({ key }) => (
                          <td key={key} className="border border-gray-200 px-1 py-0.5" style={{ minWidth: '72px' }}>
                            {readOnly ? (
                              <span
                                className={`text-xs px-1 ${
                                  item.is_completed ? 'line-through text-gray-400' : 'text-gray-800'
                                }`}
                              >
                                {item[key] as string}
                              </span>
                            ) : (
                              <input
                                type="text"
                                value={item[key] as string}
                                onChange={(e) => onItemChange?.(item.id, key, e.target.value)}
                                className="w-full text-xs px-1 py-0.5 bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-green-400 rounded transition-colors"
                                style={{ minWidth: '65px' }}
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

        {/* Footer */}
        <div className="bg-green-900 text-green-300 text-center text-xs py-2 px-4">
          African Holding Groups &mdash; Internal Use Only &mdash; Confidential
        </div>
      </div>
    </div>
  );
}
