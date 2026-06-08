import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, WeeklyPlan, PlanItem } from '../types';
import WeeklyPlanTable from './WeeklyPlanTable';
import {
  Users,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Loader2,
  ChevronLeft,
  Building2,
  TrendingUp,
  ClipboardList,
} from 'lucide-react';

interface CEODashboardProps {
  profile: Profile;
}

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
  d.setDate(d.getDate() + (n * 7));

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
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
}

type ViewState =
  | { type: 'list' }
  | { type: 'employee'; employee: Profile }
  | { type: 'plan'; employee: Profile; plan: WeeklyPlan; items: PlanItem[] };

export default function CEODashboard({ profile }: CEODashboardProps) {
  const today = new Date();
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [view, setView] = useState<ViewState>({ type: 'list' });
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(getMondayOfWeek(today));
  const [employeePlans, setEmployeePlans] = useState<Record<string, WeeklyPlan | null>>({});
  const [stats, setStats] = useState({ total: 0, plansThisWeek: 0 });

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) loadWeekStats();
  }, [employees, selectedWeek]);

  const loadEmployees = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'employee')
      .order('full_name', { ascending: true });
    setEmployees(data ?? []);
    setLoading(false);
  };

  const loadWeekStats = async () => {
    const { data: plans } = await supabase
      .from('weekly_plans')
      .select('user_id')
      .eq('week_start_date', selectedWeek);

    const planMap: Record<string, WeeklyPlan | null> = {};
    employees.forEach((e) => { planMap[e.id] = null; });
    plans?.forEach((p) => {
      const emp = employees.find((e) => e.id === p.user_id);
      if (emp) planMap[emp.id] = p as WeeklyPlan;
    });

    setEmployeePlans(planMap);
    setStats({
      total: employees.length,
      plansThisWeek: plans?.length ?? 0,
    });
  };

  const openEmployeePlan = async (employee: Profile) => {
    setLoading(true);
    const { data: plan } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('user_id', employee.id)
      .eq('week_start_date', selectedWeek)
      .maybeSingle();

    if (!plan) {
      setView({ type: 'employee', employee });
      setLoading(false);
      return;
    }

    const { data: items } = await supabase
      .from('plan_items')
      .select('*')
      .eq('plan_id', plan.id)
      .order('s_no', { ascending: true });

    setView({ type: 'plan', employee, plan, items: items ?? [] });
    setLoading(false);
  };

  const completionRate = stats.total > 0 ? Math.round((stats.plansThisWeek / stats.total) * 100) : 0;

  /* ── Employee list view ── */
  if (view.type === 'list') {
    return (
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Users size={22} className="text-green-600" />}
            label="Total Employees"
            value={stats.total}
            bg="bg-green-50"
          />
          <StatCard
            icon={<ClipboardList size={22} className="text-orange-600" />}
            label="Plans This Week"
            value={stats.plansThisWeek}
            bg="bg-orange-50"
          />
          <StatCard
            icon={<TrendingUp size={22} className="text-blue-600" />}
            label="Submission Rate"
            value={`${completionRate}%`}
            bg="bg-blue-50"
          />
        </div>

        {/* Week selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={17} className="text-green-700" />
            <span className="font-semibold text-gray-700 text-sm">Viewing week:</span>
            <span className="text-gray-900 font-medium">{formatWeekLabel(selectedWeek)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedWeek(addWeeks(selectedWeek, -1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setSelectedWeek(getMondayOfWeek(today))}
              className="text-xs font-medium text-green-700 hover:text-green-900 px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
            >
              Current Week
            </button>
            <button
              onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Employee list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users size={17} className="text-green-700" />
            <h3 className="font-semibold text-gray-800">All Employees</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-green-600" />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              No employees registered yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {employees.map((emp) => {
                const hasPlan = !!employeePlans[emp.id];
                return (
                  <li key={emp.id}>
                    <button
                      onClick={() => openEmployeePlan(emp)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {emp.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{emp.full_name}</p>
                          <p className="text-xs text-gray-500">{emp.department || 'No department'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            hasPlan
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {hasPlan ? 'Plan Submitted' : 'No Plan Yet'}
                        </span>
                        <ChevronRight
                          size={16}
                          className="text-gray-400 group-hover:text-gray-600 transition-colors"
                        />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  }

  /* ── Employee plan detail view ── */
  const backToList = () => setView({ type: 'list' });

  if (view.type === 'employee') {
    return (
      <div className="space-y-6">
        <BackButton onClick={backToList} label="Back to Employees" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-full mb-4">
            <Building2 size={22} className="text-gray-500" />
          </div>
          <h3 className="font-semibold text-gray-800 text-lg mb-1">{view.employee.full_name}</h3>
          <p className="text-gray-500 text-sm mb-2">{view.employee.department}</p>
          <p className="text-gray-500 text-sm">
            No plan submitted for{' '}
            <span className="font-medium text-gray-700">{formatWeekLabel(selectedWeek)}</span>.
          </p>
        </div>
      </div>
    );
  }

  /* view.type === 'plan' */
  return (
    <div className="space-y-6">
      <BackButton onClick={backToList} label="Back to Employees" />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <WeeklyPlanTable
          items={view.items}
          weekStart={view.plan.week_start_date}
          employeeName={view.employee.full_name}
          department={view.employee.department ?? ''}
          readOnly={true}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl p-5 border border-white shadow-sm`}>
      <div className="flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-green-700 hover:text-green-900 font-medium text-sm transition-colors"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}
