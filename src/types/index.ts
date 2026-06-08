export interface Profile {
  id: string;
  full_name: string;
  department?: string;
  role: 'ceo' | 'employee';
}

export interface WeeklyPlan {
  id: string;
  user_id: string;
  week_start_date: string;
}

export interface PlanItem {
  id: string;
  plan_id: string;
  s_no: number;
  day_of_week: string;
  page_num: number;

  a_epie: string;
  preparation: string;
  principle: string;
  plan_col: string;
  perform: string;
  productivity: string;
  profit_impl: string;
  pragmatism: string;
  persistence: string;
  profit_eval: string;

  is_completed: boolean;
}

export interface LoginLog {
  id: number;
  user_id: string;
  email: string;
  login_time: string;
  device_info: string | null;
}

export interface ActivityLog {
  id: number;
  user_id: string;
  user_name: string;
  activity: string;
  details: string | null;
  created_at: string;
}