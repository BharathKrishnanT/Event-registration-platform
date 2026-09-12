import React, { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  QrCode,
  DollarSign,
  TrendingUp,
  Building2,
  GraduationCap,
  ArrowRight,
  RefreshCw,
  Sparkles,
  MapPin,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { Event, EventKPIs, Attendance } from '../../types.ts';
import { AdminTab } from './AdminLayout.tsx';

interface DashboardViewProps {
  event: Event;
  onNavigateTab: (tab: AdminTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ event, onNavigateTab }) => {
  const isEventFree = !event.payment_enabled || event.fee === 0;
  const [kpis, setKpis] = useState<EventKPIs | null>(null);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchData = async () => {
    try {
      const [kpiRes, analyticsRes, liveRes] = await Promise.all([
        fetch(`/api/events/${event.id}/kpis`),
        fetch(`/api/events/${event.id}/analytics`),
        fetch(`/api/events/${event.id}/live`),
      ]);

      if (kpiRes.ok) setKpis(await kpiRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (liveRes.ok) {
        const liveData = await liveRes.json();
        setRecentCheckins(liveData.recentCheckins || []);
      }
      setLastRefreshed(new Date());
    } catch (e) {
      console.error('Failed to fetch dashboard data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Real-time polling every 5 seconds
    const timer = setInterval(fetchData, 5000);
    return () => clearInterval(timer);
  }, [event.id]);

  if (isLoading && !kpis) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const attendancePct = kpis ? kpis.attendance_percentage : 0;
  const confirmedCount = kpis?.confirmed_registrations || 0;
  const targetCapacity = event.capacity || 0;
  const isAutoClosed = event.status === 'REGISTRATION_CLOSED' && !!event.auto_closed_at;
  const isCapacityReached = targetCapacity > 0 && confirmedCount >= targetCapacity;
  const capacityFillPct = targetCapacity > 0 ? Math.min(100, Math.round((confirmedCount / targetCapacity) * 100)) : 0;

  return (
    <div className="space-y-8">
      {/* Auto-Close Notice Banner if capacity is full or event was auto-closed */}
      {(isAutoClosed || (isCapacityReached && event.status === 'REGISTRATION_CLOSED')) && (
        <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">Registration Automatically Closed</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  Capacity Reached
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Maximum capacity of <strong>{targetCapacity} seats</strong> has been filled ({confirmedCount} confirmed passes). Public registrations are now locked.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('events')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shrink-0 shadow-xs"
          >
            Adjust Capacity or Reopen
          </button>
        </div>
      )}

      {/* Top Banner / Event Quick Info */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live Event Dashboard
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Real-time Sync
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">{event.name}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organized by <strong>{event.club_name}</strong> • {event.start_date} ({event.start_time}) • {event.venue}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('scanner')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
          >
            <QrCode className="w-4 h-4" />
            Launch Scanner
          </button>
          <button
            onClick={() => fetchData()}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registrations */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Registered</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {kpis?.total_registrations || 0}
          </div>
          {targetCapacity > 0 ? (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>{confirmedCount} / {targetCapacity} confirmed</span>
                <span className="font-bold">{capacityFillPct}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    capacityFillPct >= 100
                      ? 'bg-rose-500'
                      : capacityFillPct >= 80
                      ? 'bg-amber-500'
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${capacityFillPct}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 mt-1">
              Capacity: Unlimited seats
            </div>
          )}
        </div>

        {/* Confirmed Passes */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Confirmed Passes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {kpis?.confirmed_registrations || 0}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">
            Active QR passes issued
          </div>
        </div>

        {isEventFree ? (
          <>
            {/* Checked In */}
            <div
              onClick={() => onNavigateTab('scanner')}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs cursor-pointer hover:border-indigo-400 transition-colors group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Checked In</span>
                <QrCode className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-3xl font-black text-indigo-600 flex items-center justify-between">
                <span>{kpis?.checked_in_count || 0}</span>
                <ArrowRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[11px] text-indigo-700 mt-1 font-medium">
                {attendancePct}% of participants scanned
              </div>
            </div>

            {/* Admission Type */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Admission Type</span>
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600">
                Free Entry
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                No fee or payment required
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Pending Verification */}
            <div
              onClick={() => onNavigateTab('payments')}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400 transition-colors group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Pending Payments</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-amber-600 flex items-center justify-between">
                <span>{kpis?.pending_payments || 0}</span>
                <ArrowRight className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[11px] text-amber-700 mt-1 font-medium">
                Requires organizer review
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Verified Revenue</span>
                <DollarSign className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-3xl font-black text-slate-900">
                ₹{kpis?.total_revenue?.toLocaleString('en-IN') || 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Fee: ₹{event.fee} per attendee
              </div>
            </div>
          </>
        )}
      </div>

      {/* Attendance Real-Time Progress Bar Section */}
      <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Real-Time Check-In Progress</h3>
            <p className="text-xs text-slate-500">
              Live scanner statistics across all gates
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-slate-900">{attendancePct}%</span>
            <span className="text-xs text-slate-500 ml-1">Turnout</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${attendancePct}%` }}
          />
        </div>

        {/* Sub metrics */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-center">
          <div>
            <div className="text-xs font-medium text-slate-500">Checked In</div>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">
              {kpis?.checked_in || 0}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Not Checked In</div>
            <div className="text-xl font-bold text-slate-700 mt-0.5">
              {kpis?.not_checked_in || 0}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Peak Check-in Time</div>
            <div className="text-sm font-bold text-indigo-600 mt-1 truncate">
              {analytics?.peak_checkin_window || '09:00 - 10:00 AM'}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* College & Department Breakdown */}
        <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Top Participating Colleges
              </h3>
            </div>
            <div className="space-y-3">
              {analytics?.by_college?.map((item: any) => {
                const max = Math.max(...analytics.by_college.map((c: any) => c.count), 1);
                const pct = Math.round((item.count / max) * 100);
                return (
                  <div key={item.college} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[280px]">
                        {item.college}
                      </span>
                      <span className="font-mono text-slate-500 font-bold">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Department Distribution
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {analytics?.by_department?.map((item: any) => (
                <div key={item.department} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 truncate" title={item.department}>
                    {item.department}
                  </div>
                  <div className="text-lg font-bold text-slate-900">{item.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Check-In Ticker & Gate Activity */}
        <div className="lg:col-span-5 bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Live Gate Ticker
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Latest check-ins</span>
            </div>

            {recentCheckins.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No check-ins recorded yet for this session.
              </div>
            ) : (
              <div className="space-y-3">
                {recentCheckins.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {item.participant_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.registration_number} • {item.department}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-emerald-700">
                        {item.gate}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.check_in_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('scanner')}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              Open Live Gate Scanner
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
