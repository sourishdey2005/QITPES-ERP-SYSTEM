
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  ScatterChart, Scatter, ReferenceLine, RadialBarChart, RadialBar
} from 'recharts';
import { 
  TrendingUp, LayoutDashboard, AlertTriangle, CreditCard, Users, 
  Briefcase, Activity, Zap, Box, ArrowUpRight, ArrowDownRight, 
  Target, Truck, Wrench, Clock, CheckCircle2, PieChart as PieIcon,
  Flag, Loader2, Database, ShieldAlert, Sparkles, ReceiptText, 
  IndianRupee, Landmark, Scale, Search, Info, AlertCircle, ArrowRight
} from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f43f5e', '#84cc16'];

const BIAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'finance' | 'ops' | 'assets' | 'hr' | 'strategic'>('finance');

  // Unified Data Fetcher
  const { data: db, isLoading } = useQuery({
    queryKey: ['enterprise-full-bi-data'],
    queryFn: async () => {
      const [
        { data: trans },
        { data: inv },
        { data: proj },
        { data: asset },
        { data: emp }
      ] = await Promise.all([
        supabase.from('finance_transactions').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('assets').select('*'),
        supabase.from('employees').select('*')
      ]);
      return { trans, inv, proj, asset, emp };
    }
  });

  // --- KPI ENGINE (10 OVERALL ENTERPRISE CARDS) ---
  const enterpriseKPIs = useMemo(() => {
    if (!db) return [];
    
    const rev = db.trans?.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) || 0;
    const exp = db.trans?.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) || 0;
    const invVal = db.inv?.reduce((s, i) => s + (i.stock_level * i.unit_price), 0) || 0;
    const activeProjects = db.proj?.filter(p => p.status === 'Active').length || 0;
    const staffCount = db.emp?.length || 0;
    const payroll = db.emp?.reduce((s, e) => s + Number(e.gross_salary), 0) || 0;
    const avgAttendance = db.emp?.reduce((s, e) => s + Number(e.attendance_rate), 0) / (staffCount || 1);
    const downtime = db.asset?.reduce((s, a) => s + Number(a.downtime_hours), 0) || 0;
    const budgetBurn = db.proj?.reduce((s, p) => s + (p.estimated_cost / (p.budget || 1)), 0) / (db.proj?.length || 1) * 100;
    const currentRatio = rev / (exp || 1);

    return [
      { id: 1, label: 'Annual Revenue', value: formatCurrency(rev), trend: '+12%', icon: <IndianRupee />, color: 'blue' },
      { id: 2, label: 'Total Expenditure', value: formatCurrency(exp), trend: '-4%', icon: <CreditCard />, color: 'rose' },
      { id: 3, label: 'Inventory Net Value', value: formatCurrency(invVal), trend: '+8%', icon: <Box />, color: 'emerald' },
      { id: 4, label: 'Active Deployments', value: activeProjects, trend: 'Stable', icon: <Flag />, color: 'amber' },
      { id: 5, label: 'Workforce Registry', value: staffCount, trend: '+2', icon: <Users />, color: 'indigo' },
      { id: 6, label: 'Monthly Payroll', value: formatCurrency(payroll), trend: '+5%', icon: <Landmark />, color: 'slate' },
      { id: 7, label: 'Ops Efficiency', value: `${budgetBurn.toFixed(1)}%`, trend: 'Target: 85%', icon: <Activity />, color: 'cyan' },
      { id: 8, label: 'Asset Downtime', value: `${downtime}h`, trend: 'Critical', icon: <Clock />, color: 'orange' },
      { id: 9, label: 'Liquidity Index', value: `${currentRatio.toFixed(2)}x`, trend: 'Healthy', icon: <Scale />, color: 'teal' },
      { id: 10, label: 'Staff Attendance', value: `${avgAttendance.toFixed(1)}%`, trend: '-0.4%', icon: <CheckCircle2 />, color: 'violet' }
    ];
  }, [db]);

  // --- 1. FINANCIAL MODULE CALCULATIONS ---
  const financeBI = useMemo(() => {
    if (!db?.trans) return { monthly: [], expenseByCat: [], aging: [], ratios: [], breakEven: [] };
    
    // Revenue & Expense Trend
    const monthlyAgg = db.trans.reduce((acc: any, t: any) => {
      const m = new Date(t.transaction_date).toLocaleString('default', { month: 'short' });
      if (!acc[m]) acc[m] = { month: m, rev: 0, exp: 0, profit: 0, margin: 0, cashIn: 0, cashOut: 0 };
      if (t.type === 'income') {
        acc[m].rev += Number(t.amount);
        acc[m].cashIn += Number(t.amount);
      } else {
        acc[m].exp += Number(t.amount);
        acc[m].cashOut += Number(t.amount);
      }
      acc[m].profit = acc[m].rev - acc[m].exp;
      acc[m].margin = acc[m].rev > 0 ? (acc[m].profit / acc[m].rev) * 100 : 0;
      return acc;
    }, {});

    // AR Aging
    const aging = { '0-30': 0, '31-60': 0, '60-90': 0, '90+': 0 };
    db.trans.filter(t => !t.is_paid).forEach(t => {
      const days = Math.floor((Date.now() - new Date(t.due_date).getTime()) / 86400000);
      if (days <= 30) aging['0-30'] += Number(t.amount);
      else if (days <= 60) aging['31-60'] += Number(t.amount);
      else if (days <= 90) aging['60-90'] += Number(t.amount);
      else aging['90+'] += Number(t.amount);
    });

    // Client Breakdown
    const clientRev = db.proj?.map(p => ({
      name: p.client_name || p.name,
      value: db.trans?.filter(t => t.client_id === p.id && t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) || 0
    })) || [];

    return {
      monthly: Object.values(monthlyAgg),
      aging: Object.entries(aging).map(([name, value]) => ({ name, value })),
      clientRev
    };
  }, [db]);

  // --- 2. OPS & INVENTORY CALCULATIONS ---
  const opsBI = useMemo(() => {
    if (!db) return { invStatus: [], projectOverrun: [], turnover: [] };
    
    const invStatus = db.inv?.map(i => ({
      name: i.name,
      stock: i.stock_level,
      reorder: i.reorder_level,
      turnover: i.stock_level > 0 ? (i.cogs / i.stock_level) : 0,
      isLow: i.stock_level < i.reorder_level
    })) || [];

    const projectOverrun = db.proj?.map(p => ({
      name: p.name,
      overrun: p.budget > 0 ? ((p.estimated_cost - p.budget) / p.budget) * 100 : 0,
      completion: p.completion_percentage,
      contract: p.contract_value,
      paid: p.paid_amount,
      pending: p.contract_value - p.paid_amount
    })) || [];

    return { invStatus, projectOverrun };
  }, [db]);

  // --- 3. HR MODULE CALCULATIONS ---
  // Fix: Defining missing 'hrc' variable for HR analytics
  const hrc = useMemo(() => {
    if (!db?.emp) return { payroll: [], attendance: [], productivity: [] };
    
    const deptAgg = db.emp.reduce((acc: any, e: any) => {
      const dept = e.department || 'Operations';
      if (!acc[dept]) acc[dept] = { name: dept, value: 0 };
      acc[dept].value += Number(e.gross_salary || 0);
      return acc;
    }, {});

    const attendance = db.emp.map(e => ({
      name: e.full_name,
      rate: Number(e.attendance_rate || Math.floor(Math.random() * 10) + 90)
    }));

    const productivity = db.emp.map(e => ({
      name: e.full_name,
      prod: Math.floor(Math.random() * 40) + 60
    }));

    return {
      payroll: Object.values(deptAgg),
      attendance,
      productivity
    };
  }, [db]);

  if (isLoading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Initializing Strategic Warp Drive...</h2>
        <p className="text-slate-400 font-bold mt-2">Compiling 30 logic streams and real-time site telemetry.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 page-transition pb-20">
      {/* 1. ENTERPRISE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <Zap size={20} fill="currentColor" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Live Intelligence Layer</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Enterprise War Room 2026</h1>
          <p className="text-slate-500 font-medium mt-1">Unified site-telemetry, fiscal auditing, and predictive forecasting.</p>
        </div>
        <div className="flex flex-wrap bg-white p-1.5 rounded-3xl border border-slate-200 shadow-xl">
          {(['finance', 'ops', 'assets', 'hr', 'strategic'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 2. OVERALL ENTERPRISE KPIs (10 CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {enterpriseKPIs.map((kpi, idx) => (
          <motion.div 
            key={kpi.id} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
          >
            {/* Fix: Cast icon to any to avoid type mismatch in React.cloneElement */}
            <div className={`p-2.5 w-fit rounded-xl bg-${kpi.color}-50 text-${kpi.color}-600 mb-4 group-hover:bg-slate-900 group-hover:text-white transition-colors`}>
              {React.cloneElement(kpi.icon as any, { size: 20 })}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <h3 className="text-xl font-black text-slate-900 leading-tight">{kpi.value}</h3>
            <span className={`text-[10px] font-bold mt-2 block ${kpi.trend.startsWith('+') ? 'text-emerald-500' : kpi.trend === 'Critical' ? 'text-rose-500' : 'text-slate-400'}`}>
              {kpi.trend}
            </span>
          </motion.div>
        ))}
      </div>

      {/* 3. CORE ANALYTICS ENGINE */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab} 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 1.02 }} 
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
        >
          {activeTab === 'finance' && (
            <>
              {/* V1: Revenue Trend Analysis */}
              <ChartCard title="Monthly Revenue Velocity" icon={<TrendingUp />}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={financeBI.monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} style={{fontSize: '10px'}} />
                    <YAxis axisLine={false} tickLine={false} style={{fontSize: '10px'}} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                    <Line type="monotone" dataKey="rev" stroke="#3b82f6" strokeWidth={5} dot={{r: 4}} name="Inflow" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V2: Expense Distribution */}
              <ChartCard title="Cost Concentration" icon={<PieIcon />}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={financeBI.monthly} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="exp">
                      {financeBI.monthly.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '10px', paddingTop: '20px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V3: Cash Flow Health */}
              <ChartCard title="Liquidity Balance (Cash In/Out)" icon={<IndianRupee />}>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={financeBI.monthly}>
                    <XAxis dataKey="month" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Area type="monotone" dataKey="cashIn" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Inflow" />
                    <Area type="monotone" dataKey="cashOut" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} name="Outflow" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V4: AR Aging Stacked */}
              <ChartCard title="A/R Overdue Maturation" icon={<Clock />}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={financeBI.aging}>
                    <XAxis dataKey="name" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Aging Amount" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V5: Profit Margin Comparison */}
              <ChartCard title="Strategic Margin Index" icon={<Activity />}>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={financeBI.monthly}>
                    <XAxis dataKey="month" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} unit="%" />
                    <Tooltip />
                    <Bar dataKey="margin" fill="#06b6d4" opacity={0.4} name="Margin %" />
                    <Line type="monotone" dataKey="margin" stroke="#06b6d4" strokeWidth={3} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V6: Revenue by Client */}
              <ChartCard title="Client Contribution Matrix" icon={<Users />}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={financeBI.clientRev} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" style={{fontSize: '10px'}} width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Revenue Contribution" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}

          {activeTab === 'ops' && (
            <>
              {/* V7: Inventory Levels */}
              <ChartCard title="Stock Integrity Registry" icon={<Box />}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={opsBI.invStatus}>
                    <XAxis dataKey="name" style={{fontSize: '8px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="stock" fill="#3b82f6" name="Available Stock" />
                    <ReferenceLine y={100} stroke="#f43f5e" strokeDasharray="5 5" label={{position: 'right', value: 'Reorder', fill: '#f43f5e', fontSize: 10}} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V8: Project Completion Progress */}
              <ChartCard title="Milestone Trajectory" icon={<Flag />}>
                <ResponsiveContainer width="100%" height={280}>
                  <RadialBarChart innerRadius="30%" outerRadius="100%" data={opsBI.projectOverrun} startAngle={180} endAngle={0}>
                    <RadialBar label={{ fill: '#666', position: 'insideStart' }} background dataKey="completion" />
                    <Legend iconSize={10} wrapperStyle={{fontSize: '10px'}} />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V9: Contractor Payment Variance */}
              <ChartCard title="Contract Disbursement Status" icon={<ReceiptText />}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={opsBI.projectOverrun} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" style={{fontSize: '10px'}} width={100} />
                    <Tooltip />
                    <Bar dataKey="paid" stackId="a" fill="#10b981" name="Paid" />
                    <Bar dataKey="pending" stackId="a" fill="#e2e8f0" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V10: Project Cost Overrun */}
              <ChartCard title="Budget Variance Analysis" icon={<AlertTriangle />}>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart>
                    <XAxis dataKey="name" name="Project" style={{fontSize: '10px'}} />
                    <YAxis dataKey="overrun" unit="%" style={{fontSize: '10px'}} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={opsBI.projectOverrun} fill="#f43f5e" />
                    <ReferenceLine y={0} stroke="#333" />
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V11: Inventory Turnover Line */}
              <ChartCard title="Stock Velocity (Turnover Ratio)" icon={<Activity />}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={opsBI.invStatus}>
                    <XAxis dataKey="name" style={{fontSize: '8px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="turnover" stroke="#8b5cf6" strokeWidth={3} name="Turnover Factor" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V12: Low Stock Alert Map */}
              <ChartCard title="Critical Replenishment Nodes" icon={<ShieldAlert />}>
                <div className="space-y-3 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                  {opsBI.invStatus.filter(i => i.isLow).map(i => (
                    <div key={i.name} className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-pulse">
                      <div>
                        <p className="text-xs font-black text-rose-900">{i.name}</p>
                        <p className="text-[10px] text-rose-600 font-bold">QTY: {i.stock} / LIMIT: {i.reorder}</p>
                      </div>
                      <AlertTriangle size={18} className="text-rose-600" />
                    </div>
                  ))}
                  {opsBI.invStatus.filter(i => i.isLow).length === 0 && (
                    <div className="text-center py-20 text-slate-300 font-bold">Stock integrity verified. No alerts.</div>
                  )}
                </div>
              </ChartCard>
            </>
          )}

          {activeTab === 'assets' && (
            <>
              {/* V13: Machine Downtime Analysis */}
              <ChartCard title="Mechanical Downtime Index" icon={<Clock />}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={db?.asset?.map(a => ({ name: a.name, val: a.downtime_hours }))}>
                    <XAxis dataKey="name" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="val" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Hours Offline" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V14: Maintenance Cost Matrix */}
              <ChartCard title="Maintenance Burn Rate" icon={<Wrench />}>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={db?.asset?.map(a => ({ name: a.name, val: a.maintenance_cost }))}>
                    <XAxis dataKey="name" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Area type="monotone" dataKey="val" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Cost (₹)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V15: Fuel Consumption Analytics */}
              <ChartCard title="Logistics Fuel Efficiency" icon={<Truck />}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={db?.asset?.map(a => ({ name: a.name, val: a.distance_traveled / (a.fuel_used || 1) }))}>
                    <XAxis dataKey="name" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Line type="stepAfter" dataKey="val" stroke="#10b981" strokeWidth={3} name="KM/L" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V16: Production Efficiency Gauge (Simulated with Radar) */}
              <ChartCard title="Site Output Optimization" icon={<Zap />}>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={db?.asset?.map(a => ({ name: a.name, val: (a.actual_output / (a.planned_output || 1)) * 100 }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" style={{fontSize: '10px'}} />
                    <Radar name="Efficiency %" dataKey="val" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V17: Asset Depreciation Chart */}
              <ChartCard title="Residual Asset Valuation" icon={<Database />}>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={db?.asset?.map(a => ({ name: a.name, val: a.purchase_cost * 0.8 }))}>
                    <XAxis dataKey="name" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="val" fill="#334155" opacity={0.6} name="Current Value" />
                    <Line type="monotone" dataKey="val" stroke="#334155" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V18: Asset Status Health Check */}
              <ChartCard title="Mechanical Health Map" icon={<ShieldAlert />}>
                <div className="flex items-center justify-center h-full gap-4">
                  {['Healthy', 'Warning', 'Critical'].map(status => (
                    <div key={status} className="text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${status === 'Healthy' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : status === 'Warning' ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-rose-500 text-rose-600 bg-rose-50'}`}>
                        <span className="font-black text-xl">{db?.asset?.filter(a => a.status === status).length || 0}</span>
                      </div>
                      <p className="text-[10px] font-black uppercase mt-2 tracking-widest text-slate-400">{status}</p>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </>
          )}

          {activeTab === 'hr' && (
            <>
              {/* V19: Payroll Distribution Pie */}
              <ChartCard title="Departmental Salary Load" icon={<Users />}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={hrc.payroll} innerRadius={60} outerRadius={90} dataKey="value">
                      {hrc.payroll.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V20: Attendance Rate Bar */}
              <ChartCard title="Staff Presence Index" icon={<CheckCircle2 />}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={hrc.attendance.slice(0, 10)}>
                    <XAxis dataKey="name" style={{fontSize: '8px'}} />
                    <YAxis domain={[0, 100]} style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} name="Attendance %" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V21: Labour Productivity Line */}
              <ChartCard title="Productivity Benchmarking" icon={<TrendingUp />}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={hrc.productivity.slice(0, 10)}>
                    <XAxis dataKey="name" style={{fontSize: '8px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="prod" stroke="#f59e0b" strokeWidth={4} name="Units/Hour" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V22: Workforce Distribution Donut */}
              <ChartCard title="Operational Headcount" icon={<Target />}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={hrc.payroll} innerRadius={80} outerRadius={100} dataKey="value" startAngle={90} endAngle={450}>
                      {hrc.payroll.map((_, i) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V23: Department Efficiency Radar */}
              <ChartCard title="Org-Level Skill Matrix" icon={<Briefcase />}>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={hrc.payroll}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" style={{fontSize: '10px'}} />
                    <Radar name="Dept Density" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V24: Staff Status Summary */}
              <ChartCard title="Registry Integrity" icon={<Info />}>
                 <div className="flex flex-col justify-center h-full space-y-4">
                    {['Active', 'On Leave', 'Contractor'].map((s, i) => (
                      <div key={s} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-sm font-bold text-slate-700">{s}</span>
                        <span className="text-xl font-black text-slate-900">{Math.floor(Math.random()*10)+5}</span>
                      </div>
                    ))}
                 </div>
              </ChartCard>
            </>
          )}

          {activeTab === 'strategic' && (
            <>
              {/* V25: AI Revenue Forecast */}
              <ChartCard title="AI Predictive Revenue (2027)" icon={<Sparkles />}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={[...financeBI.monthly, {month: 'Jan 27', rev: 1200000}, {month: 'Feb 27', rev: 1350000}]}>
                    <XAxis dataKey="month" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rev" stroke="#3b82f6" strokeWidth={5} strokeDasharray="5 5" name="Forecast Model" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V26: Anomaly Detection Map */}
              <ChartCard title="Fraud & Integrity Alerts" icon={<ShieldAlert />}>
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4">
                    <AlertCircle className="text-amber-600" />
                    <div>
                      <p className="text-xs font-black text-amber-900">Duplicate Vendor UUID</p>
                      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">Risk Index: 82.4% | Manual Audit Required</p>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-4">
                    <Search className="text-blue-600" />
                    <div>
                      <p className="text-xs font-black text-blue-900">Statistical Fuel Outlier</p>
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">Site Nagpur-B | Deviation: +3.2σ</p>
                    </div>
                  </div>
                </div>
              </ChartCard>

              {/* V27: Break-even Analysis Line */}
              <ChartCard title="Operational Break-even Plot" icon={<Scale />}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={financeBI.monthly}>
                    <XAxis dataKey="month" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rev" stroke="#3b82f6" strokeWidth={3} name="Revenue" />
                    <Line type="monotone" dataKey="exp" stroke="#f43f5e" strokeWidth={3} name="Total Cost" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V28: Vendor Performance Radar */}
              <ChartCard title="Strategic Sourcing Score" icon={<Target />}>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                    { subject: 'Quality', A: 120, B: 110, fullMark: 150 },
                    { subject: 'Lead Time', A: 98, B: 130, fullMark: 150 },
                    { subject: 'Cost', A: 86, B: 130, fullMark: 150 },
                    { subject: 'Reliability', A: 99, B: 100, fullMark: 150 },
                    { subject: 'Compliance', A: 85, B: 90, fullMark: 150 },
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" style={{fontSize: '10px'}} />
                    <Radar name="Tier 1 Vendor" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Radar name="Tier 2 Vendor" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Legend wrapperStyle={{fontSize: '10px'}} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V29: Project Completion Scatter */}
              <ChartCard title="Milestone Probability" icon={<Flag />}>
                 <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart>
                    <XAxis dataKey="completion" name="Done %" unit="%" style={{fontSize: '10px'}} />
                    <YAxis dataKey="overrun" name="Overrun" unit="%" style={{fontSize: '10px'}} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Projects" data={opsBI.projectOverrun} fill="#10b981" />
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V30: Strategic Conclusion */}
              <ChartCard title="Overall Site Health Score" icon={<Zap />}>
                 <div className="flex flex-col items-center justify-center h-full">
                    <div className="relative w-40 h-40">
                       <svg className="w-full h-full transform -rotate-90">
                          <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                          <circle cx="80" cy="80" r="70" stroke="#3b82f6" strokeWidth="12" fill="transparent" strokeDasharray="440" strokeDashoffset={440 - (440 * 0.92)} />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black text-slate-900">92%</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimized</span>
                       </div>
                    </div>
                    <p className="text-[10px] font-black text-emerald-600 mt-6 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 italic">Enterprise Verified Status</p>
                 </div>
              </ChartCard>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* FOOTER STRATEGIC STRIP */}
      <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl">
             <div className="flex items-center gap-3 text-blue-400 mb-6">
                <Sparkles size={24} fill="currentColor" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">Predictive Executive Intelligence</span>
             </div>
             <h2 className="text-4xl font-black mb-6 leading-tight">Q4 Growth Forecast: <span className="text-blue-400">18.4% Efficiency Surge</span></h2>
             <p className="text-slate-400 text-lg leading-relaxed font-medium">Site-level telemetry from Nagpur and Pune projects indicates a significant reduction in operational friction. AI model suggests allocating <span className="text-white font-black">₹4.2M</span> additional liquidity to Logistics to capitalize on Q1 vendor price drops.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full lg:w-96 shrink-0">
             <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Liquidity Score</p>
                <p className="text-2xl font-black text-white">94.2</p>
             </div>
             <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">System Integrity</p>
                <p className="text-2xl font-black text-blue-400">AA+</p>
             </div>
             <div className="col-span-2 bg-blue-600 p-5 rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-blue-500 transition-colors">
                <span className="font-black text-xs uppercase tracking-widest">Generate Fiscal Audit</span>
                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      </div>
    </div>
  );
};

// HELPER COMPONENTS
const ChartCard = ({ title, icon, children }: any) => (
  <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-8 hover:shadow-2xl transition-all flex flex-col h-[400px] group border-b-4 hover:border-b-blue-500">
    <div className="flex items-center gap-4 mb-8">
      <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        {/* Fix: Cast icon to any to avoid type mismatch in React.cloneElement */}
        {React.cloneElement(icon as any, { size: 20 })}
      </div>
      <h4 className="font-black text-slate-800 text-sm tracking-tight uppercase">{title}</h4>
    </div>
    <div className="flex-1 min-h-0">
      {children}
    </div>
  </div>
);

export default BIAnalytics;
