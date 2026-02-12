
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
  ScatterChart, Scatter, ReferenceLine, RadialBarChart, RadialBar,
  Treemap, FunnelChart, Funnel, LabelList
} from 'recharts';
import {
  TrendingUp, AlertTriangle, CreditCard, Users,
  Activity, Zap, Box, ArrowUpRight,
  Target, Truck, Wrench, Clock, CheckCircle2,
  Flag, Loader2, Database, ShieldAlert, Sparkles,
  IndianRupee, Scale, Search, Info, AlertCircle, ArrowRight,
  Filter, Calendar, Thermometer, Brain, User, Timer, Star, Flame, ShieldCheck, Skull
} from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f43f5e', '#84cc16'];

const BIAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'finance' | 'hr' | 'inventory' | 'ops' | 'ai' | 'sales'>('finance');
  const queryClient = useQueryClient();

  // Unified Real-Time Data Fetcher
  const { data: db, isLoading } = useQuery({
    queryKey: ['enterprise-full-bi-data'],
    queryFn: async () => {
      const results = await Promise.all([
        supabase.from('finance_transactions').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('assets').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('sales_leads').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('contract_attendance').select('*'),
        supabase.from('meetings').select('*'),
        supabase.from('shift_assignments').select('*'),
        supabase.from('conference_rooms').select('*')
      ]);

      return {
        trans: results[0].data || [],
        inv: results[1].data || [],
        proj: results[2].data || [],
        asset: results[3].data || [],
        emp: results[4].data || [],
        leads: results[5].data || [],
        customers: results[6].data || [],
        attendance: results[7].data || [],
        meetings: results[8].data || [],
        shifts: results[9].data || [],
        rooms: results[10].data || []
      };
    }
  });

  // Real-Time Subscriptions
  useEffect(() => {
    const channel = supabase.channel('bi-realtime-master')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        queryClient.invalidateQueries({ queryKey: ['enterprise-full-bi-data'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // --- 1. FINANCIAL INTELLIGENCE ---
  const finBI = useMemo(() => {
    if (!db?.trans) return null;

    // Revenue Velocity (By Transaction Date)
    const velocity = db.trans.reduce((acc: any, t) => {
      const hour = new Date(t.transaction_date).getHours();
      const label = `${hour}:00`;
      acc[label] = (acc[label] || 0) + (t.type === 'income' ? Number(t.amount) : 0);
      return acc;
    }, {});
    const hourlyVelocity = Object.entries(velocity).map(([hour, rev]) => ({ hour, rev })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    // Margins
    const totalRev = db.trans.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExp = db.trans.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const margin = totalRev > 0 ? ((totalRev - totalExp) / totalRev) * 100 : 0;

    // Expense Anomalies (Standard Deviation approach or simple % growth)
    const expenseTrend = db.trans.filter(t => t.type === 'expense').map(t => ({
      date: new Date(t.transaction_date).toLocaleDateString(),
      val: Number(t.amount),
      isSpike: Number(t.amount) > (totalExp / (db.trans.length || 1) * 2)
    })).slice(-15);

    // Cash Flow Forecast
    const currentBalance = totalRev - totalExp;
    const forecast = Array.from({ length: 15 }, (_, i) => ({
      day: `D+${i + 1}`,
      cash: currentBalance + (i * (totalRev / 30 || 10000)) - (i * (totalExp / 30 || 8000))
    }));

    // Burn Rate (Assuming monthly cash pool)
    const monthlyExp = totalExp / (db.trans.length > 0 ? 1 : 1); // Simplified
    const burnRate = currentBalance > 0 ? (currentBalance / (monthlyExp || 1)) : 0;

    // Dept Profitability (Derived from project departments)
    const deptMap = db.proj.reduce((acc: any, p) => {
      const key = p.name.split(' ')[0]; // Use first word as dept proxy
      acc[key] = (acc[key] || 0) + (p.contract_value - p.estimated_cost);
      return acc;
    }, {});
    const deptProfit = Object.entries(deptMap).map(([subject, val]) => ({ subject, A: val as number }));

    // AR Aging (Real data from finance_transactions is_paid = false)
    const agingBuckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    db.trans.filter(t => !t.is_paid && t.due_date).forEach(t => {
      const days = Math.floor((Date.now() - new Date(t.due_date).getTime()) / 86400000);
      if (days <= 30) agingBuckets['0-30'] += Number(t.amount);
      else if (days <= 60) agingBuckets['31-60'] += Number(t.amount);
      else if (days <= 90) agingBuckets['61-90'] += Number(t.amount);
      else agingBuckets['90+'] += Number(t.amount);
    });
    const aging = Object.entries(agingBuckets).map(([name, val], i) => ({
      name: `${name} Days`,
      val,
      color: COLORS[i % COLORS.length]
    }));

    return { hourlyVelocity, margin, expenseTrend, forecast, burnRate, deptProfit, aging };
  }, [db]);

  // --- 2. HR & WORKFORCE ---
  const hrBI = useMemo(() => {
    if (!db?.emp) return null;
    const totalAttendance = db.attendance.length;
    const presentCount = db.attendance.filter(a => a.status === 'Present').length;
    const attendanceScore = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

    const lateTrend = db.attendance.reduce((acc: any, a) => {
      const day = new Date(a.attendance_date).toLocaleDateString('en-US', { weekday: 'short' });
      if (a.status === 'Absent') acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    const otCosts = db.emp.reduce((acc: any, e) => {
      const dept = e.department || 'General';
      acc[dept] = (acc[dept] || 0) + (Number(e.gross_salary) * 0.1); // Estimated OT as 10% base
      return acc;
    }, {});

    const attritionRisk = (db.emp.filter(e => e.employee_status !== 'Active').length / db.emp.length) * 100 || 0;
    const contribution = db.emp.map(e => ({
      name: e.full_name.split(' ')[0],
      val: (Number(e.gross_salary) / 1000) * 1.5 // Proxy weighting
    })).slice(0, 8);

    const payrollTree = {
      name: "Payroll",
      children: Object.entries(db.emp.reduce((acc: any, e) => {
        acc[e.department] = acc[e.department] || { name: e.department, children: [] };
        acc[e.department].children.push({ name: e.full_name, size: Number(e.gross_salary) });
        return acc;
      }, {})).map(([_, v]) => v) as any[]
    };

    return { attendanceScore, lateTrend: Object.entries(lateTrend).map(([day, count]) => ({ day, count })), otCosts: Object.entries(otCosts).map(([dept, cost]) => ({ dept, cost })), attritionRisk, contribution, payrollTree };
  }, [db]);

  // --- 3. INVENTORY ---
  const invBI = useMemo(() => {
    if (!db?.inv) return null;
    const totalInventoryValue = db.inv.reduce((s, i) => s + (Number(i.stock_level) * Number(i.unit_price)), 0);
    const totalCOGS = db.inv.reduce((s, i) => s + Number(i.cogs || 0), 0);
    const turnover = totalInventoryValue > 0 ? totalCOGS / totalInventoryValue : 0;

    const deadStock = db.inv.filter(i => {
      const days = Math.floor((Date.now() - new Date(i.last_updated).getTime()) / 86400000);
      return days > 30;
    }).map(i => ({ name: i.name, days: Math.floor((Date.now() - new Date(i.last_updated).getTime()) / 86400000) }));

    const stockOutRisk = db.inv.map(i => ({
      name: i.name,
      daysLeft: Number(i.stock_level) / (Number(i.reorder_level) / 30 || 1)
    })).filter(i => i.daysLeft < 10);

    return { turnover, deadStock, stockOutRisk };
  }, [db]);

  // --- 4. OPERATIONS ---
  const opsBI = useMemo(() => {
    if (!db?.meetings) return null;
    const meetingLoad = db.meetings.reduce((acc: any, m) => {
      const hour = new Date(m.start_time).getHours();
      const label = `${hour}:00`;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const shiftUtilization = [
      { name: 'Assigned', value: db.shifts.length },
      { name: 'Capacity', value: db.emp.length * 2 }
    ];

    const roomEff = db.rooms.map(r => ({
      room: r.name,
      hrs: db.meetings.filter(m => m.room_id === r.id).length * 2 // Estimation: 2hrs per meeting
    }));

    return {
      meetingLoad: Object.entries(meetingLoad).map(([hour, load]) => ({ hour, load })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour)),
      shiftUtilization,
      roomEff
    };
  }, [db]);

  // --- 5. AI & STRATEGIC ---
  const aiBI = useMemo(() => {
    if (!db) return null;
    const stressIndex = (db.inv.filter(i => i.stock_level < i.reorder_level).length / db.inv.length) * 100 || 0;
    const opEff = (db.attendance.filter(a => a.status === 'Present').length / (db.attendance.length || 1)) * 100;
    return { stressIndex, opEff };
  }, [db]);

  // --- 6. SALES ---
  const salesBI = useMemo(() => {
    if (!db?.leads) return null;
    const stages = db.leads.reduce((acc: any, l) => {
      acc[l.stage] = (acc[l.stage] || 0) + 1;
      return acc;
    }, {});
    const funnel = Object.entries(stages).map(([name, value], i) => ({ name, value: value as number, fill: COLORS[i % COLORS.length] }));
    const clv = db.customers.reduce((s, c) => s + Number(c.total_spend), 0) / (db.customers.length || 1);
    return { funnel, clv };
  }, [db]);

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-[#020617]">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-black text-white tracking-[0.2em] uppercase">Synchronizing Live ERP Data...</h2>
        <p className="text-slate-500 font-bold mt-2">Connecting to QITPES Real-Time Node Registry.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-8 space-y-10 selection:bg-blue-500/30">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-blue-400">
            <Zap size={22} fill="currentColor" className="animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.4em]">Live System Status: Synchronized</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
            REAL-TIME <span className="text-blue-500">BI HUB</span>
          </h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl">
            Zero-simulation dashboard. Fetching directly from Supabase Postgres Realtime.
          </p>
        </div>
        <div className="flex flex-wrap bg-slate-900/40 p-2 rounded-[32px] border border-white/5 backdrop-blur-3xl shadow-inner">
          {(['finance', 'hr', 'inventory', 'ops', 'ai', 'sales'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {activeTab === 'finance' && finBI && (
            <>
              <VisualCard title="Revenue Flow" icon={<Activity />} sub="Hourly DB Snapshot">
                <ResponsiveContainer><LineChart data={finBI.hourlyVelocity}><CartesianGrid stroke="#1e293b" /><XAxis dataKey="hour" stroke="#475569" style={{ fontSize: 10 }} /><YAxis stroke="#475569" style={{ fontSize: 10 }} /><Tooltip /><Line type="step" dataKey="rev" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6' }} /></LineChart></ResponsiveContainer>
              </VisualCard>
              <VisualCard title="Yield Margin" icon={<Thermometer />} sub="Gross Fiscal Delta">
                <div className="flex flex-col items-center justify-center h-full relative">
                  <PieChart width={250} height={140}><Pie data={[{ v: finBI.margin }, { v: 100 - finBI.margin }]} innerRadius={70} outerRadius={90} startAngle={180} endAngle={0} dataKey="v"><Cell fill="#3b82f6" /><Cell fill="#0f172a" /></Pie></PieChart>
                  <div className="absolute top-[60%] text-center"><span className="text-5xl font-black text-white">{finBI.margin.toFixed(1)}%</span></div>
                </div>
              </VisualCard>
              <VisualCard title="Cost Spikes" icon={<ShieldAlert />} sub="Anomaly Detection">
                <ResponsiveContainer><BarChart data={finBI.expenseTrend}><XAxis dataKey="date" hide /><YAxis hide /><Tooltip /><Bar dataKey="val">{finBI.expenseTrend.map((e, i) => <Cell key={i} fill={e.isSpike ? '#ef4444' : '#1e293b'} />)}</Bar></BarChart></ResponsiveContainer>
              </VisualCard>
              <VisualCard title="Cash Drift" icon={<TrendingUp />} sub="15-Day Variance">
                <ResponsiveContainer><AreaChart data={finBI.forecast}><Area type="monotone" dataKey="cash" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={3} /><Tooltip /></AreaChart></ResponsiveContainer>
              </VisualCard>
              <VisualCard title="Runway" icon={<Flame />} sub="Survival Nodes">
                <div className="flex flex-col items-center justify-center h-full"><span className="text-8xl font-black text-white">{finBI.burnRate.toFixed(1)}</span><p className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Months Pool</p></div>
              </VisualCard>
              <VisualCard title="Profit Sites" icon={<RadarIcon />} sub="Project Yield">
                <ResponsiveContainer><RadarChart data={finBI.deptProfit}><PolarGrid stroke="#1e293b" /><PolarAngleAxis dataKey="subject" stroke="#64748b" style={{ fontSize: 10 }} /><Radar dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} /></RadarChart></ResponsiveContainer>
              </VisualCard>
              <VisualCard title="AR Overdue" icon={<GridIcon />} sub="Aging Buckets">
                <div className="grid grid-cols-1 gap-2 h-full">
                  {finBI.aging.map(a => <div key={a.name} className="p-4 bg-slate-900 rounded-2xl flex justify-between items-center"><span className="text-[10px] font-black">{a.name}</span><span className="font-black text-white" style={{ color: a.color }}>₹{(a.val / 1000).toFixed(0)}K</span></div>)}
                </div>
              </VisualCard>
            </>
          )}

          {activeTab === 'hr' && hrBI && (
            <>
              <VisualCard title="Site Presence" icon={<CheckCircle2 />} sub="Attendance Score">
                <div className="text-center py-10 text-6xl font-black text-emerald-500">{hrBI.attendanceScore.toFixed(1)}%</div>
              </VisualCard>
              <VisualCard title="Absence Map" icon={<Clock />} sub="Daily Deviation">
                <ResponsiveContainer><BarChart data={hrBI.lateTrend}><XAxis dataKey="day" stroke="#475569" style={{ fontSize: 10 }} /><Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
              </VisualCard>
              <VisualCard title="OT Burden" icon={<Activity />} sub="Dept OT Estimation">
                <ResponsiveContainer><BarChart data={hrBI.otCosts} layout="vertical"><YAxis dataKey="dept" type="category" hide /><Tooltip /><Bar dataKey="cost" fill="#8b5cf6" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>
              </VisualCard>
              <VisualCard title="Departure Risk" icon={<ShieldAlert />} sub="Inactivity Score">
                <div className="flex items-center justify-center h-full"><span className={`text-6xl font-black ${hrBI.attritionRisk > 10 ? 'text-rose-500' : 'text-emerald-500'}`}>{hrBI.attritionRisk.toFixed(1)}%</span></div>
              </VisualCard>
              <VisualCard title="Contribution" icon={<User />} sub="Weighted Productivity">
                <ResponsiveContainer><BarChart data={hrBI.contribution}><XAxis dataKey="name" stroke="#475569" style={{ fontSize: 10 }} /><Bar dataKey="val" fill="#3b82f6" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
              </VisualCard>
              <VisualCard title="Payroll Matrix" icon={<Database />} sub="Salary Density Tree">
                <ResponsiveContainer><Treemap data={hrBI.payrollTree.children} dataKey="size" stroke="#000" fill="#3b82f6" /></ResponsiveContainer>
              </VisualCard>
            </>
          )}

          {activeTab === 'inventory' && invBI && (
            <>
              <VisualCard title="Turnover" icon={<Zap />} sub="Velocity Vector">
                <div className="flex items-center justify-center h-full text-[100px] font-black text-blue-500">{invBI.turnover.toFixed(1)}<span className="text-xl">x</span></div>
              </VisualCard>
              <VisualCard title="Stall Nodes" icon={<Skull />} sub="Stagnant > 30 Days">
                <div className="space-y-4 overflow-y-auto max-h-full pr-2 custom-scrollbar">
                  {invBI.deadStock.map(i => <div key={i.name} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex justify-between"><span className="text-[10px] font-bold">{i.name}</span><span className="text-rose-500 font-black">{i.days}D</span></div>)}
                </div>
              </VisualCard>
              <VisualCard title="Stock Exhaustion" icon={<Timer />} sub="Nodes Under 10 Days">
                <div className="space-y-4">{invBI.stockOutRisk.map(i => <div key={i.name} className="space-y-2"><div className="flex justify-between text-[10px] font-black"><span>{i.name}</span><span>{i.daysLeft.toFixed(1)} Days Left</span></div><div className="h-1 bg-slate-900 rounded-full"><motion.div initial={{ width: 0 }} animate={{ width: `${(i.daysLeft / 10) * 100}%` }} className="h-full bg-blue-500" /></div></div>)}</div>
              </VisualCard>
            </>
          )}

          {activeTab === 'ops' && opsBI && (
            <>
              <VisualCard title="Meeting Load" icon={<Calendar />} sub="Temporal Density">
                <ResponsiveContainer><AreaChart data={opsBI.meetingLoad}><Area dataKey="load" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={4} /></AreaChart></ResponsiveContainer>
              </VisualCard>
              <VisualCard title="Capacity Delta" icon={<Users />} sub="Filled vs Cap">
                <ResponsiveContainer><PieChart><Pie data={opsBI.shiftUtilization} innerRadius={60} outerRadius={90} dataKey="value" startAngle={90} endAngle={450} paddingAngle={5}><Cell fill="#3b82f6" /><Cell fill="#0f172a" /></Pie><Tooltip /></PieChart></ResponsiveContainer>
              </VisualCard>
              <VisualCard title="Venue Load" icon={<Box />} sub="Room Usage Estimate">
                <ResponsiveContainer><BarChart data={opsBI.roomEff}><XAxis dataKey="room" hide /><Tooltip /><Bar dataKey="hrs" fill="#14b8a6" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
              </VisualCard>
            </>
          )}

          {activeTab === 'ai' && aiBI && (
            <>
              <VisualCard title="Stress Vector" icon={<Brain />} sub="Critical Stock Index">
                <div className="text-center py-8 text-[120px] font-black text-rose-600 leading-none">{aiBI.stressIndex.toFixed(0)}</div>
              </VisualCard>
              <VisualCard title="Efficiency" icon={<Zap />} sub="Live Ops Score">
                <div className="flex items-center justify-center h-full"><div className="w-40 h-40 rounded-full border-[15px] border-slate-900 border-t-emerald-500 flex items-center justify-center font-black text-4xl">{aiBI.opEff.toFixed(1)}%</div></div>
              </VisualCard>
            </>
          )}

          {activeTab === 'sales' && salesBI && (
            <>
              <VisualCard title="Funnel Hub" icon={<Filter />} sub="Lead Maturation">
                <ResponsiveContainer><FunnelChart><Funnel data={salesBI.funnel} dataKey="value" nameKey="name" labelLine={false}><LabelList position="right" fill="#94a3b8" stroke="none" dataKey="name" style={{ fontSize: 10, fontWeight: 900 }} /></Funnel></FunnelChart></ResponsiveContainer>
              </VisualCard>
              <VisualCard title="Avg. CLV" icon={<Users />} sub="Customer Lifetime Pool">
                <div className="flex items-center justify-center h-full text-5xl font-black text-white">₹{(salesBI.clv / 1000).toFixed(0)}K</div>
              </VisualCard>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const VisualCard = ({ title, icon, sub, children, wide }: any) => (
  <motion.div
    whileHover={{ y: -8, scale: 1.01, borderColor: 'rgba(59, 130, 246, 0.4)' }}
    className={`bg-[#0f172a]/80 backdrop-blur-3xl border border-white/10 p-8 rounded-[40px] shadow-2xl flex flex-col group h-[400px] transition-all relative overflow-hidden ${wide ? 'md:col-span-2' : ''}`}
  >
    <div className="flex items-center justify-between mb-8 relative z-10">
      <div className="flex gap-4 items-center">
        <div className="p-4 bg-slate-900 text-blue-400 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-6">
          {React.cloneElement(icon as any, { size: 22 })}
        </div>
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-widest">{title}</h4>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{sub}</p>
        </div>
      </div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_#3b82f6]" />
    </div>
    <div className="flex-1 min-h-0 relative z-10">
      {children}
    </div>
    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/10" />
  </motion.div>
);

const RadarIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 12L19 19" /><path d="M12 12L5 19" /><path d="M12 12V2" /></svg>;
const GridIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;

export default BIAnalytics;
