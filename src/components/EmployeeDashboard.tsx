import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, WeeklyPlan, PlanItem, WeeklyReport } from '../types';
import SWOTModal from './SWOTModal';
import ReportModal from './ReportModal';
import WeeklyPlanTable,{formatPlanAsText,formatWeekRange} from './WeeklyPlanTable';
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Trash2,
  Loader2,
  CheckCircle2,
  Calendar,
  Save,
  CloudOff,
  Cloud,
  Send,
  BellRing,
  FileBarChart,
  MessageSquare,
  X,
} from 'lucide-react';

interface EmployeeDashboardProps {
  profile: Profile;
}

const WEEK_DAYS_CONFIG = [
  { day: 'Monday', s_no: 1 },
  { day: 'Tuesday', s_no: 1 },
  { day: 'Wednesday', s_no: 1 },
  { day: 'Thursday', s_no: 1 },
  { day: 'Friday', s_no: 1 },
  { day: 'Saturday', s_no: 1 },
];

function getMondayOfWeek(date: Date): string {
  const d = new Date(date);

  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);

  d.setDate(diff);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

function addWeeks(weekStart: string, n: number): string {
  const [year, month, day] = weekStart.split('-').map(Number);

  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + n * 7);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(weekStart + 'T00:00:00');
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', {
    ...opts,
    year: 'numeric',
  })}`;
}

function buildEmptyItem(
  planId: string,
  day: string,
  sNo: number,
  pageNum: number
): Omit<PlanItem, 'id'> {
  return {
    plan_id: planId,
    s_no: sNo,
    day_of_week: day,
    page_num: pageNum,
    a_epie: '',
    preparation: '',
    principle: '',
    plan_col: '',
    perform: '',
    productivity: '',
    profit_impl: '',
    pragmatism: '',
    persistence: '',
    profit_eval: '',
    is_completed: false,
  };
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function getReminderUrgency(weekStart: string): null | 'medium' | 'high' {
  const today = new Date();
  const weekStartDate = new Date(weekStart + 'T00:00:00');
  const weekEndDate = new Date(weekStart + 'T00:00:00');
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  if (today < weekStartDate || today > weekEndDate) return null;
  const dow = today.getDay(); // 0=Sun,1=Mon,...,6=Sat
  if (dow === 4) return 'medium'; // Thursday
  if (dow === 5 || dow === 6) return 'high'; // Friday or Saturday
  return null;
}

export default function EmployeeDashboard({ profile }: EmployeeDashboardProps) {
  const today = new Date();
  const [currentWeek, setCurrentWeek] = useState(getMondayOfWeek(today));
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [showSWOTModal, setShowSWOTModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

   const [swotData, setSwotData] = useState<{
          strengths: string;
          weaknesses: string;
          opportunities: string;
          threats: string;
 } | null>(null);

const [existingReport, setExistingReport] =
  useState<WeeklyReport | null>(null);

  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const saveItemToDb = useCallback(async (item: PlanItem) => {
    setSaveState('saving');
    const { error: err } = await supabase
      .from('plan_items')
      .update({
        a_epie: item.a_epie,
        preparation: item.preparation,
        principle: item.principle,
        plan_col: item.plan_col,
        perform: item.perform,
        productivity: item.productivity,
        profit_impl: item.profit_impl,
        pragmatism: item.pragmatism,
        persistence: item.persistence,
        profit_eval: item.profit_eval,
        is_completed: item.is_completed,
      })
      .eq('id', item.id);
    setSaveState(err ? 'error' : 'saved');
    if (!err) setTimeout(() => setSaveState('idle'), 2000);
  }, []);
 
  const removeRowForDay = async (day: string) => {
  if (!plan) return;

  // Get rows for this day and current page
  const dayItems = items.filter(
    (item) =>
      item.day_of_week === day &&
      item.page_num === currentPage
  );

  // Nothing to remove
  if (dayItems.length === 0) return;

  // Find the last row (highest s_no)
  const lastRow = dayItems.reduce((last, current) =>
    current.s_no > last.s_no ? current : last
  );

  // Delete from Supabase
  const { error } = await supabase
    .from("plan_items")
    .delete()
    .eq("id", lastRow.id);

  if (error) {
    console.error("Failed to delete row:", error);
    return;
  }

  // Remove from React state
  setItems((prev) =>
    prev.filter((item) => item.id !== lastRow.id)
  );
};

  const handleReportClick = async () => {
  await saveAllNow();

  if (existingReport) {
    setSwotData({
      strengths: existingReport.strengths,
      weaknesses: existingReport.weaknesses,
      opportunities: existingReport.opportunities,
      threats: existingReport.threats,
    });

    setShowReportModal(true);
  } else {
    setShowSWOTModal(true);
  }
};
 
const handleDownload = () => {
  const today = new Date();

  const dateString = today.toISOString().split('T')[0]; // 2026-06-17

  const text = formatPlanAsText(
    items,
    currentWeek,
    profile.full_name,
    profile.department ?? ''
  );

  const blob = new Blob([text], {
    type: 'text/plain;charset=utf-8',
  });

  const fileName = [
    'Weekly-Plan',
    formatWeekRange(currentWeek).replace(/[^\w\s-]/g, ''),
    dateString,
  ]
    .join('-')
    .replace(/\s+/g, '-');

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.txt`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError('');
    setPlan(null);
    setItems([]);
    setExistingReport(null);
    setShowCEOComment(true);


    const { data: CEOreport, error: reportError } = await supabase
  .from("weekly_plans")
  .select("*")
  .eq("user_id", profile.id)
  .eq("week_start_date", currentWeek)
  .maybeSingle();

    if (reportError) {
      console.error(reportError);
    } else if (CEOreport) {
      setExistingReport(CEOreport);

      if (CEOreport.ceo_comment && CEOreport.ceo_comment.trim() !== "") {
        setCEOComment(CEOreport.ceo_comment);
        setShowCEOComment(true);
      }
    }

    // console.log("CEO Comment:", CEOreport?.ceo_comment);

    const { data: report } = await supabase
  .from('weekly_reports')
  .select('*')
  .eq('user_id', profile.id)
  .eq('week_start_date', currentWeek)
  .maybeSingle();

  if (report) {
  setExistingReport(report);
  }
    const { data: existingPlan, error: planErr } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('user_id', profile.id)
      .eq('week_start_date', currentWeek)
      .maybeSingle();

    if (planErr) {
      setError('Failed to load plan.');
      setLoading(false);
      return;
    }

    if (existingPlan) {
      setPlan(existingPlan);
      const { data: itemData } = await supabase
        .from('plan_items')
        .select('*')
        .eq('plan_id', existingPlan.id)
        .order('page_num', { ascending: true })
        .order('s_no', { ascending: true });
      setItems(itemData ?? []);
    }

    setLoading(false);
  }, [profile.id, currentWeek]);

  useEffect(() => {
    loadPlan();
    setCurrentPage(1);
    setReminderDismissed(false);
  }, [loadPlan]);

  const createPlan = async () => {
    setCreating(true);
    setError('');

    const { data: newPlan, error: createErr } = await supabase
      .from('weekly_plans')
      .insert({ user_id: profile.id, week_start_date: currentWeek })
      .select()
      .single();

    if (createErr || !newPlan) {
      setError('Could not create plan. Please try again.');
      setCreating(false);
      return;
    }

    const defaultRows = WEEK_DAYS_CONFIG.map((cfg) =>
      buildEmptyItem(newPlan.id, cfg.day, cfg.s_no, 1)
    );
    const { data: insertedItems, error: insertErr } = await supabase
      .from('plan_items')
      .insert(defaultRows)
      .select();

    if (insertErr) setError('Plan created but rows could not be added.');

    setPlan(newPlan);
    setItems(insertedItems ?? []);
    setCreating(false);
  };

  const handleItemChange = (id: string, field: keyof PlanItem, value: string | boolean) => {
    setItems((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, [field]: value } : item));
      const updatedItem = updated.find((i) => i.id === id);
      if (updatedItem) {
        const existing = debounceTimers.current.get(id);
        if (existing) clearTimeout(existing);
        const timer = setTimeout(() => {
          saveItemToDb(updatedItem);
          debounceTimers.current.delete(id);
        }, 800);
        debounceTimers.current.set(id, timer);
      }
      return updated;
    });
  };

  const handleToggleComplete = async (id: string, value: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_completed: value } : item))
    );
    setSaveState('saving');
    const { error: err } = await supabase
      .from('plan_items')
      .update({ is_completed: value })
      .eq('id', id);
    setSaveState(err ? 'error' : 'saved');
    if (!err) setTimeout(() => setSaveState('idle'), 1500);
  };

  const saveAllNow = async () => {
    if (!plan || items.length === 0) return;
    setSaveState('saving');
    debounceTimers.current.forEach((timer) => clearTimeout(timer));
    debounceTimers.current.clear();

    const updates = items.map((item) =>
      supabase.from('plan_items').update({
        a_epie: item.a_epie,
        preparation: item.preparation,
        principle: item.principle,
        plan_col: item.plan_col,
        perform: item.perform,
        productivity: item.productivity,
        profit_impl: item.profit_impl,
        pragmatism: item.pragmatism,
        persistence: item.persistence,
        profit_eval: item.profit_eval,
        is_completed: item.is_completed,
      }).eq('id', item.id)
    );
    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);
    setSaveState(hasError ? 'error' : 'saved');
    setTimeout(() => setSaveState('idle'), 2500);
  };

  const handleSendToTelegram = async () => {
    await saveAllNow();
    const text = formatPlanAsText(items, currentWeek, profile.full_name, profile.department ?? '');
    window.open(`https://t.me/share/url?text=${encodeURIComponent(text)}`, '_blank');
  };

  const addRowForDay = async (day: string) => {
    if (!plan) return;
    const dayItems = items.filter((i) => i.day_of_week === day && i.page_num === currentPage);
    const nextSNo = dayItems.length > 0 ? Math.max(...dayItems.map((i) => i.s_no)) + 1 : 1;
    const { data, error: err } = await supabase
      .from('plan_items')
      .insert(buildEmptyItem(plan.id, day, nextSNo, currentPage))
      .select()
      .single();
    if (!err && data) setItems((prev) => [...prev, data]);
  };

  const addPage = async () => {
    if (!plan) return;
    const nextPage = Math.max(...items.map((i) => i.page_num), 0) + 1;
    const newRows = WEEK_DAYS_CONFIG.map((cfg) =>
      buildEmptyItem(plan.id, cfg.day, 1, nextPage)
    );
    const { data, error: err } = await supabase
      .from('plan_items')
      .insert(newRows)
      .select();
    if (!err && data) {
      setItems((prev) => [...prev, ...data]);
      setCurrentPage(nextPage);
    }
  };

  const removePage = async (page: number) => {
    const ids = items.filter((i) => i.page_num === page).map((i) => i.id);
    if (ids.length === 0) return;
    await supabase.from('plan_items').delete().in('id', ids);
    const remaining = items.filter((i) => i.page_num !== page);
    setItems(remaining);
    const remPages = Array.from(new Set(remaining.map((i) => i.page_num))).sort((a, b) => a - b);
    setCurrentPage(remPages[remPages.length - 1] ?? 1);
  };

  const pages = Array.from(new Set(items.map((i) => i.page_num))).sort((a, b) => a - b);
  const isCurrentWeek = currentWeek === getMondayOfWeek(today);
  const reminderUrgency = isCurrentWeek ? getReminderUrgency(currentWeek) : null;
  const pendingItems = items.filter((i) => !i.is_completed);
  const showReminder = reminderUrgency && pendingItems.length > 0 && !reminderDismissed && !!plan;
  const [ceoComment, setCEOComment] = useState("");
  const [showCEOComment, setShowCEOComment] = useState(false);
  const dayStats = (() => {
  const days = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  return days.map((day) => {
    const dayItems = items.filter((i) => i.day_of_week === day);

    const total = dayItems.length;
    const completed = dayItems.filter((i) => i.is_completed).length;

    return {
      day,
      total,
      completed,
      percentage:
        total > 0
          ? Math.round((completed / total) * 100)
          : 0,
    };
  });
})();
  
  const handleSWOTSubmit = async (swot: {
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
}) => {
  const reportData = {
    user_id: profile.id,
    week_start_date: currentWeek,
    strengths: swot.strengths,
    weaknesses: swot.weaknesses,
    opportunities: swot.opportunities,
    threats: swot.threats,
  };

  const { data, error } = await supabase
    .from('weekly_reports')
    .upsert(reportData, {
      onConflict: 'user_id,week_start_date',
    })
    .select()
    .single();

  if (!error && data) {
    setExistingReport(data);
  }

  setSwotData(swot);
  setShowReportModal(true);
};
  const SaveIndicator = () => {
    if (saveState === 'idle') return null;
    return (
      <span className={`flex items-center gap-1.5 text-xs font-medium ${
        saveState === 'saving' ? 'text-orange-600' :
        saveState === 'saved' ? 'text-green-600' : 'text-red-600'
      }`}>
        {saveState === 'saving' ? <><Loader2 size={12} className="animate-spin" /> Saving…</> :
         saveState === 'saved' ? <><Cloud size={12} /> Saved</> :
         <><CloudOff size={12} /> Failed</>}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Reminder banner */}
      {showReminder && (
        <div className={`rounded-xl border-l-4 p-4 flex items-start justify-between gap-3 shadow-sm ${
          reminderUrgency === 'high' ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'
        }`}>
          <div className="flex items-start gap-3">
            <BellRing size={20} className={`shrink-0 mt-0.5 ${reminderUrgency === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
            <div>
              <p className={`font-bold text-sm ${reminderUrgency === 'high' ? 'text-red-700' : 'text-amber-700'}`}>
                {reminderUrgency === 'high' ? 'Urgent: Week Ending Soon!' : 'Reminder: Week Nearing End'}
              </p>
              <p className={`text-xs mt-0.5 ${reminderUrgency === 'high' ? 'text-red-600' : 'text-amber-600'}`}>
                You have <span className="font-bold">{pendingItems.length}</span> uncompleted task{pendingItems.length > 1 ? 's' : ''} this week.{' '}
                {reminderUrgency === 'high'
                  ? 'Today is the last chance to complete your plan before Saturday reporting.'
                  : 'Friday and Saturday are approaching — finish your tasks before the week ends.'}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Array.from(new Set(pendingItems.map((i) => i.day_of_week))).map((day) => (
                  <span key={day} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    reminderUrgency === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>{day}</span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => setReminderDismissed(true)}
            className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
      )}



     
        <div className="mb-6 rounded-lg border-l-4 border-blue-600 bg-blue-50 p-4 shadow">
          <h3 className="text-lg font-bold text-blue-800 mb-2">
            📢 CEO Weekly Message
          </h3>

          <p className="text-gray-700 whitespace-pre-wrap">
            {ceoComment}
          </p>
        </div>



      {/* Week navigator */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-800 to-green-700 px-4 py-2 flex items-center justify-between">
          <span className="text-green-200 text-xs font-medium uppercase tracking-wide flex items-center gap-1.5">
            <Calendar size={13} /> Week Navigation
          </span>
          {isCurrentWeek && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              CURRENT WEEK
            </span>
          )}
        </div>
                
        <div className="flex items-stretch">
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
            className="flex flex-col items-center justify-center h-20 w-16 bg-green-50 hover:bg-green-100 border-r border-gray-100 text-green-700 hover:text-green-900 transition-colors group shrink-0"
          >
            <ChevronLeft size={28} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs text-green-600 font-medium">Prev</span>
          </button>
          <div className="flex-1 text-center px-4 flex flex-col items-center justify-center">
            <p className="text-lg font-bold text-gray-800">{formatWeekLabel(currentWeek)}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Monday – Friday (Tasks) &bull; Saturday (Reporting)
            </p>
          </div>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="flex flex-col items-center justify-center h-20 w-16 bg-green-50 hover:bg-green-100 border-l border-gray-100 text-green-700 hover:text-green-900 transition-colors group shrink-0"
          >
            <ChevronRight size={28} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs text-green-600 font-medium">Next</span>
          </button>
        </div>
        {!isCurrentWeek && (
          <div className="px-4 py-2 border-t border-gray-100 flex justify-center">
            <button
              onClick={() => setCurrentWeek(getMondayOfWeek(today))}
              className="text-xs font-semibold text-orange-600 hover:text-orange-800 transition-colors"
            >
              Jump to Current Week
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-green-600" />
        </div>
      )}
      
      {/* No plan */}
      {!loading && !plan && (
        <div className="bg-white rounded-2xl shadow-sm border border-dashed border-green-300 p-14 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-5">
            <Calendar size={28} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Plan for This Week</h3>
          <p className="text-gray-500 text-sm mb-2">
            Create your weekly schedule for{' '}
            <span className="font-semibold text-gray-700">{formatWeekLabel(currentWeek)}</span>.
          </p>
          <p className="text-gray-400 text-xs mb-7">
            Monday – Friday for tasks &bull; Saturday for reporting
          </p>
          <button
            onClick={createPlan}
            disabled={creating}
            className="inline-flex items-center gap-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-lg text-sm"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
            {creating ? 'Creating…' : 'Create Weekly Plan'}
          </button>
        </div>
      )}

      {/* Plan */}
      {!loading && plan && (
        <>
          {/* Page navigation bar */}
          {pages.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const idx = pages.indexOf(currentPage);
                    if (idx > 0) setCurrentPage(pages[idx - 1]);
                  }}
                  disabled={pages.indexOf(currentPage) === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-green-200"
                >
                  <ChevronLeft size={16} /> Previous Page
                </button>
                <div className="flex items-center gap-1 mx-2">
                  {pages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        p === currentPage
                          ? 'bg-orange-500 text-white shadow'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const idx = pages.indexOf(currentPage);
                    if (idx < pages.length - 1) setCurrentPage(pages[idx + 1]);
                  }}
                  disabled={pages.indexOf(currentPage) === pages.length - 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-green-200"
                >
                  Next Page <ChevronRight size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={addPage}
                  className="text-xs font-medium text-green-700 hover:text-green-900 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <PlusCircle size={13} /> Add Page
                </button>
                {pages.length > 1 && (
                  <button
                    onClick={() => removePage(currentPage)}
                    className="text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} /> Remove Page
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Table card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <WeeklyPlanTable
              items={items}
              weekStart={currentWeek}
              employeeName={profile.full_name}
              department={profile.department ?? ''}
              readOnly={false}
              onItemChange={handleItemChange}
              onToggleComplete={handleToggleComplete}
            />

            {/* Add row controls */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-2">Adjust rows for a specific day:</p>
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS_CONFIG.map(({ day }) => (
                  <div key={day} className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    {/* Decrease Row Button (-) */}
                    <button
                      onClick={() => removeRowForDay(day)}
                      className="text-xs font-medium px-2.5 py-1.5 transition-colors border-r border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                      title={`Remove last row from ${day}`}
                    >
                      -
                    </button>
                    
                    {/* Increase Row Button (+) */}
                    <button
                      onClick={() => addRowForDay(day)}
                      className={`text-xs font-medium px-3 py-1.5 transition-colors ${
                        day === 'Saturday'
                          ? 'bg-green-50 text-green-800 hover:bg-green-100'
                          : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
                      }`}
                    >
                      + {day.slice(0, 3)}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save / Send action bar */}
            <div className="px-4 py-3 bg-green-50 border-t border-green-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-green-700">
                <CheckCircle2 size={13} />
                <span>Auto-saved — changes sync to database as you type</span>
                <SaveIndicator />
              </div>

              <div className="flex items-center gap-2">
                {/* Save */}
                <button
                  onClick={saveAllNow}
                  disabled={saveState === 'saving'}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow ${
                    saveState === 'saved'
                      ? 'bg-green-500 text-white'
                      : saveState === 'saving'
                      ? 'bg-green-400 text-white cursor-wait'
                      : 'bg-green-700 hover:bg-green-800 text-white'
                  }`}
                >
                  {saveState === 'saving' ? (
                    <><Loader2 size={14} className="animate-spin" /> Saving…</>
                  ) : saveState === 'saved' ? (
                    <><CheckCircle2 size={14} /> Saved!</>
                  ) : (
                    <><Save size={14} /> Save</>
                  )}
                </button>
                
                <button onClick={handleDownload} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-500 hover:bg-blue-600 text-white transition-all shadow"
                  title="Download the Plan">
                Download
                </button>
                <button
          onClick={handleReportClick}
  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white transition-all shadow"
>
  <FileBarChart size={14} />
  Report
</button>
                {/* Send to Telegram */}
                <button
                  onClick={handleSendToTelegram}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-500 hover:bg-blue-600 text-white transition-all shadow"
                  title="Save and send to Telegram"
                >
                  <Send size={14} />
                  Send
                </button>
              </div>
            </div>
          </div>
        </>
      )}
  <SWOTModal
  isOpen={showSWOTModal}
  onClose={() => setShowSWOTModal(false)}
  onSubmit={handleSWOTSubmit}
  employeeName={profile.full_name}
  weekLabel={formatWeekLabel(currentWeek)}
/>

{swotData && (
  <ReportModal
    isOpen={showReportModal}
    onClose={() => setShowReportModal(false)}
    swot={swotData}
    employeeName={profile.full_name}
    department={profile.department ?? ''}
    weekLabel={formatWeekLabel(currentWeek)}
    weekStart={currentWeek}
    dayStats={dayStats}
    totalTasks={items.length}
    completedTasks={items.filter((i) => i.is_completed).length}
  />
)}
    </div>
    
  );
  
}
