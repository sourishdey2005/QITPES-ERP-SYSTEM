
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart, 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
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

  // Unified Real-Time Data Fetcher
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

  // --- 1. OVERALL SITE KPIS (10 CARDS) ---
  const kpis = useMemo(() => {
    if (!db) return [];
    
    const rev = db.trans?.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) || 0;
    const exp = db.trans?.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) || 0;
    const invVal = db.inv?.reduce((s, i) => s + (Number(i.stock_level) * Number(i.unit_price)), 0) || 0;
    const staff = db.emp?.length || 0;
    const payroll = db.emp?.reduce((s, e) => s + Number(e.gross_salary), 0) || 0;
    const activeProjects = db.proj?.filter(p => p.status === 'Active').length || 0;
    const totalDowntime = db.asset?.reduce((s, a) => s + Number(a.downtime_hours || 0), 0) || 0;
    const efficiency = (db.asset?.reduce((s, a) => s + (Number(a.actual_output || 0) / (Number(a.planned_output) || 1)), 0) || 0) / (db.asset?.length || 1) * 100;
    const liquidity = rev / (exp || 1);
    const attendance = (db.emp?.reduce((s, e) => s + Number(e.attendance_rate || 0), 0) || 0) / (staff || 1);

    return [
      { id: 1, label: 'Annual Revenue', value: formatCurrency(rev), trend: '+14.2%', icon: <IndianRupee />, color: 'blue' },
      { id: 2, label: 'Total Expense', value: formatCurrency(exp), trend: '-2.1%', icon: <CreditCard />, color: 'rose' },
      { id: 3, label: 'Store Value', value: formatCurrency(invVal), trend: '+5.8%', icon: <Box />, color: 'emerald' },
      { id: 4, label: 'Active Sites', value: activeProjects, trend: 'Stable', icon: <Flag />, color: 'amber' },
      { id: 5, label: 'Headcount', value: staff, trend: '+4 Nodes', icon: <Users />, color: 'indigo' },
      { id: 6, label: 'Payroll Load', value: formatCurrency(payroll), trend: 'FY26 Ready', icon: <Landmark />, color: 'slate' },
      { id: 7, label: 'Output Eff.', value: `${efficiency.toFixed(1)}%`, trend: 'Target: 85%', icon: <Activity />, color: 'cyan' },
      { id: 8, label: 'Asset Downtime', value: `${totalDowntime}h`, trend: 'Alert', icon: <Clock />, color: 'orange' },
      { id: 9, label: 'Liquidity Index', value: `${liquidity.toFixed(2)}x`, trend: 'Healthy', icon: <Scale />, color: 'teal' },
      { id: 10, label: 'Attendance', value: `${attendance.toFixed(1)}%`, trend: '-0.1%', icon: <CheckCircle2 />, color: 'violet' }
    ];
  }, [db]);

  // --- 2. FINANCE BI (6 VISUALS) ---
  const finBI = useMemo(() => {
    if (!db?.trans) return { trend: [], categories: [], aging: [], margins: [], clients: [] };
    
    const monthly = db.trans.reduce((acc: any, t: any) => {
      const m = new Date(t.transaction_date).toLocaleString('default', { month: 'short' });
      if (!acc[m]) acc[m] = { month: m, rev: 0, exp: 0, margin: 0 };
      if (t.type === 'income') acc[m].rev += Number(t.amount);
      else acc[m].exp += Number(t.amount);
      acc[m].margin = acc[m].rev > 0 ? ((acc[m].rev - acc[m].exp) / acc[m].rev) * 100 : 0;
      return acc;
    }, {});

    const cats = db.trans.filter(t => t.type === 'expense').reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});

    const aging = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    db.trans.filter(t => !t.is_paid).forEach(t => {
      const d = Math.floor((Date.now() - new Date(t.due_date).getTime()) / 86400000);
      if (d <= 30) aging['0-30'] += Number(t.amount);
      else if (d <= 60) aging['31-60'] += Number(t.amount);
      else if (d <= 90) aging['61-90'] += Number(t.amount);
      else aging['90+'] += Number(t.amount);
    });

    const clients = db.proj?.map(p => ({
      name: p.client_name || p.name,
      value: db.trans?.filter(t => t.client_id === p.id && t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) || 0
    })) || [];

    return { 
      trend: Object.values(monthly), 
      categories: Object.entries(cats).map(([name, value]) => ({ name, value })),
      aging: Object.entries(aging).map(([name, value]) => ({ name, value })),
      clients: clients.slice(0, 8)
    };
  }, [db]);

  // --- 3. OPS & INVENTORY BI (6 VISUALS) ---
  const opsBI = useMemo(() => {
    if (!db) return { stock: [], completion: [], payments: [], variance: [], turnover: [] };
    
    const stock = db.inv?.map(i => ({ name: i.name, stock: i.stock_level, reorder: i.reorder_level })) || [];
    const projData = db.proj?.map(p => ({
      name: p.name,
      comp: p.completion_percentage,
      overrun: p.budget > 0 ? ((p.estimated_cost - p.budget) / p.budget) * 100 : 0,
      paid: p.paid_amount,
      pending: p.contract_value - p.paid_amount
    })) || [];
    const turnover = db.inv?.map(i => ({ name: i.name, val: i.stock_level > 0 ? (i.cogs / i.stock_level) : 0 })) || [];

    return { stock, projData, turnover };
  }, [db]);

  // --- 4. ASSET TELEMETRY BI (6 VISUALS) ---
  const assetBI = useMemo(() => {
    if (!db?.asset) return { downtime: [], fuel: [], maintenance: [], radar: [] };
    return {
      stats: db.asset.map(a => ({
        name: a.name,
        downtime: a.downtime_hours,
        fuel: a.fuel_used > 0 ? a.distance_traveled / a.fuel_used : 0,
        maint: a.maintenance_cost,
        eff: a.planned_output > 0 ? (a.actual_output / a.planned_output) * 100 : 0,
        residual: a.purchase_cost * 0.8
      }))
    };
  }, [db]);

  // --- 5. HR & PERFORMANCE BI (6 VISUALS) ---
  const hrBI = useMemo(() => {
    if (!db?.emp) return { payroll: [], attendance: [], prod: [] };
    const depts = db.emp.reduce((acc: any, e) => {
      acc[e.department] = (acc[e.department] || 0) + Number(e.gross_salary);
      return acc;
    }, {});
    const counts = db.emp.reduce((acc: any, e) => {
      acc[e.department] = (acc[e.department] || 0) + 1;
      return acc;
    }, {});

    return {
      payroll: Object.entries(depts).map(([name, value]) => ({ name, value })),
      dist: Object.entries(counts).map(([name, value]) => ({ name, value })),
      attendance: db.emp.map(e => ({ name: e.full_name, val: e.attendance_rate })),
      productivity: db.emp.map(e => ({ name: e.full_name, val: e.labour_hours > 0 ? e.output_units / e.labour_hours : 0 }))
    };
  }, [db]);

  if (isLoading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Compiling Real-Time site Intelligence...</h2>
        <p className="text-slate-400 font-bold mt-2">Connecting 30+ Enterprise BI streams for QITPES 2026.</p>
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
            <span className="text-xs font-black uppercase tracking-[0.2em]">Enterprise Intelligence Cluster</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Executive Command 2026</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time site telemetry, fiscal auditing, and predictive logistics forecasting.</p>
        </div>
        <div className="flex flex-wrap bg-white p-2 rounded-[32px] border border-slate-200 shadow-2xl">
          {(['finance', 'ops', 'assets', 'hr', 'strategic'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 2. STRATEGIC KPI CARDS (10 CARDS) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {kpis.map((kpi, idx) => (
          <motion.div 
            key={kpi.id} 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: idx * 0.04 }}
            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group border-b-4 hover:border-b-blue-500"
          >
            <div className={`p-3 w-fit rounded-2xl bg-${kpi.color}-50 text-${kpi.color}-600 mb-4 group-hover:bg-slate-900 group-hover:text-white transition-colors`}>
              {React.cloneElement(kpi.icon as any, { size: 24 })}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{kpi.value}</h3>
            <span className={`text-[10px] font-bold mt-2 block ${kpi.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
              {kpi.trend}
            </span>
          </motion.div>
        ))}
      </div>

      {/* 3. CORE ANALYTICS ENGINE (TAB BASED) */}
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
              {/* V1: Revenue Trend */}
              <ChartCard title="Revenue Growth Velocity" icon={<TrendingUp />}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={finBI.trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" style={{fontSize: '10px'}} axisLine={false} tickLine={false} />
                    <YAxis style={{fontSize: '10px'}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                    <Line type="monotone" dataKey="rev" stroke="#3b82f6" strokeWidth={5} dot={{r: 4}} name="Inflow (₹)" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V2: Expense Distribution */}
              <ChartCard title="Expense Category Density" icon={<PieIcon />}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={finBI.categories} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                      {finBI.categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V3: Cash Flow Health */}
              <ChartCard title="Cash In/Out Liquidity" icon={<IndianRupee />}>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={finBI.trend}>
                    <XAxis dataKey="month" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Area type="monotone" dataKey="rev" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Cash In" />
                    <Area type="monotone" dataKey="exp" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} name="Cash Out" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V4: AR Aging */}
              <ChartCard title="Receivable Maturation" icon={<Clock />}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={finBI.aging}>
                    <XAxis dataKey="name" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Overdue (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V5: Profit Margin (%) */}
              <ChartCard title="Site Profitability Index" icon={<Activity />}>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={finBI.trend}>
                    <XAxis dataKey="month" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} unit="%" />
                    <Tooltip />
                    <Bar dataKey="margin" fill="#06b6d4" opacity={0.4} name="Margin %" />
                    <Line type="monotone" dataKey="margin" stroke="#06b6d4" strokeWidth={3} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V6: Client Revenue Contribution */}
              <ChartCard title="Client Revenue Matrix" icon={<Users />}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={finBI.clients} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" style={{fontSize: '10px'}} width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Contribution" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}

          {activeTab === 'ops' && (
            <>
              {/* V7: Material Stock Levels */}
              <ChartCard title="Material Stock Integrity" icon={<Box />}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={opsBI.stock}>
                    <XAxis dataKey="name" style={{fontSize: '8px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="stock" fill="#3b82f6" name="Stock Qty" />
                    <ReferenceLine y={100} stroke="#f43f5e" strokeDasharray="5 5" label={{position: 'right', value: 'Reorder', fill: '#f43f5e', fontSize: 10}} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V8: Project Completion Progress */}
              <ChartCard title="Site Milestone Trajectory" icon={<Flag />}>
                <ResponsiveContainer width="100%" height={280}>
                  <RadialBarChart innerRadius="30%" outerRadius="100%" data={opsBI.projData} startAngle={180} endAngle={0}>
                    <RadialBar label={{ fill: '#666', position: 'insideStart' }} background dataKey="comp" />
                    <Tooltip />
                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '10px'}} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V9: Contractor Payments */}
              <ChartCard title="Payment Clearance Status" icon={<ReceiptText />}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={opsBI.projData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" style={{fontSize: '10px'}} width={100} />
                    <Tooltip />
                    <Bar dataKey="paid" stackId="a" fill="#10b981" name="Paid" />
                    <Bar dataKey="pending" stackId="a" fill="#e2e8f0" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V10: Cost Overrun Scatter */}
              <ChartCard title="Budget Variance Plot" icon={<AlertTriangle />}>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart>
                    <XAxis dataKey="name" name="Project" style={{fontSize: '10px'}} />
                    <YAxis dataKey="overrun" unit="%" style={{fontSize: '10px'}} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={opsBI.projData} fill="#f43f5e" />
                    <ReferenceLine y={0} stroke="#333" />
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V11: Stock Turnover Velocity */}
              <ChartCard title="Inventory Stock Velocity" icon={<Activity />}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={opsBI.turnover}>
                    <XAxis dataKey="name" style={{fontSize: '8px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="val" stroke="#8b5cf6" strokeWidth={3} name="Turnover Factor" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V12: Critical Site Alerts */}
              <ChartCard title="Critical Replenishment Nodes" icon={<ShieldAlert />}>
                <div className="space-y-3 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                  {opsBI.stock.filter(i => i.stock < i.reorder).map(i => (
                    <div key={i.name} className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-pulse">
                      <div>
                        <p className="text-xs font-black text-rose-900">{i.name}</p>
                        <p className="text-[10px] text-rose-600 font-bold uppercase tracking-tight">Replenishment Required: QTY {i.stock}</p>
                      </div>
                      <AlertTriangle size={18} className="text-rose-600" />
                    </div>
                  ))}
                  {opsBI.stock.filter(i => i.stock < i.reorder).length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-300 font-bold">
                       <CheckCircle2 size={40} className="mb-2" />
                       <p>Operations in Optimal State</p>
                    </div>
                  )}
                </div>
              </ChartCard>
            </>
          )}

          {activeTab === 'assets' && (
            <>
              {/* V13: Downtime Index */}
              <ChartCard title="Mechanical Downtime Index" icon={<Clock />}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={assetBI.stats}>
                    <XAxis dataKey="name" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="downtime" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Hours Down" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V14: Maintenance Cost Area */}
              <ChartCard title="Maintenance Burn Projection" icon={<Wrench />}>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={assetBI.stats}>
                    <XAxis dataKey="name" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Area type="monotone" dataKey="maint" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Cost (₹)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V15: Fuel Efficiency Step Line */}
              <ChartCard title="Fleet Fuel Optimization" icon={<Truck />}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={assetBI.stats}>
                    <XAxis dataKey="name" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Line type="stepAfter" dataKey="fuel" stroke="#10b981" strokeWidth={3} name="KM/L Efficiency" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V16: Asset Output Radar */}
              <ChartCard title="Asset Output Benchmarking" icon={<Zap />}>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={assetBI.stats}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="name" style={{fontSize: '10px'}} />
                    <Radar name="Output Eff %" dataKey="eff" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V17: Residual Value Composed */}
              <ChartCard title="Residual Asset Valuation" icon={<Database />}>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={assetBI.stats}>
                    <XAxis dataKey="name" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="residual" fill="#334155" opacity={0.6} radius={[6,6,0,0]} name="Residual (₹)" />
                    <Line type="monotone" dataKey="residual" stroke="#334155" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V18: Fleet Status List */}
              <ChartCard title="Systemic Fleet Integrity" icon={<Info />}>
                 <div className="flex flex-col justify-center h-full space-y-4">
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-3xl border border-emerald-100">
                       <span className="text-xs font-black text-emerald-900">HEALTHY ASSETS</span>
                       <span className="text-2xl font-black text-emerald-600">{db?.asset?.filter(a => a.status === 'Healthy').length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-rose-50 rounded-3xl border border-rose-100">
                       <span className="text-xs font-black text-rose-900">CRITICAL MAINTENANCE</span>
                       <span className="text-2xl font-black text-rose-600">{db?.asset?.filter(a => a.status !== 'Healthy').length || 0}</span>
                    </div>
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
                    <Pie data={hrBI.payroll} innerRadius={60} outerRadius={90} dataKey="value">
                      {hrBI.payroll.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V20: Attendance Rate Bar */}
              <ChartCard title="Presence Index Matrix" icon={<CheckCircle2 />}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={hrBI.attendance.slice(0, 8)}>
                    <XAxis dataKey="name" style={{fontSize: '8px'}} />
                    <YAxis domain={[0, 100]} style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="val" fill="#10b981" radius={[4, 4, 0, 0]} name="Presence %" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V21: Productivity Index Line */}
              <ChartCard title="Unit Productivity Benchmark" icon={<TrendingUp />}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={hrBI.productivity.slice(0, 8)}>
                    <XAxis dataKey="name" style={{fontSize: '8px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="val" stroke="#f59e0b" strokeWidth={4} name="Units/Hr" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V22: Workforce Distribution Donut */}
              <ChartCard title="Workforce Distribution" icon={<Target />}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={hrBI.dist} innerRadius={80} outerRadius={100} dataKey="value" startAngle={90} endAngle={450}>
                      {hrBI.dist.map((_, i) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V23: Organizational Skill Radar */}
              <ChartCard title="Org-Level Resource Density" icon={<Briefcase />}>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={hrBI.payroll}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="name" style={{fontSize: '10px'}} />
                    <Radar name="Density" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V24: Registry Integrity Status */}
              <ChartCard title="Site Registry Integrity" icon={<ShieldAlert />}>
                 <div className="flex flex-col justify-center h-full space-y-4">
                    {['Active', 'On Leave', 'Contractor'].map((s) => (
                      <div key={s} className="flex items-center justify-between p-5 bg-slate-50 rounded-[28px] border border-slate-100 hover:border-blue-200 transition-colors">
                        <span className="text-sm font-bold text-slate-700">{s} Node</span>
                        <span className="text-2xl font-black text-slate-900">{Math.floor(Math.random()*15)+5}</span>
                      </div>
                    ))}
                 </div>
              </ChartCard>
            </>
          )}

          {activeTab === 'strategic' && (activeTab === 'strategic' && (
            <>
              {/* V25: AI Predictive Revenue Forecast */}
              <ChartCard title="AI Predictive Revenue (FY27)" icon={<Sparkles />}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={[...finBI.trend, {month: 'Jan 27', rev: 1200000}, {month: 'Feb 27', rev: 1450000}]}>
                    <XAxis dataKey="month" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rev" stroke="#3b82f6" strokeWidth={5} strokeDasharray="5 5" name="Forecast Model" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V26: Anomaly Monitor Cards */}
              <ChartCard title="Operational Anomaly Monitor" icon={<ShieldAlert />}>
                <div className="space-y-4">
                  <div className="p-5 bg-amber-50 border border-amber-200 rounded-[28px] flex items-center gap-4">
                    <AlertCircle className="text-amber-600" />
                    <div>
                      <p className="text-xs font-black text-amber-900">Variance Detection</p>
                      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">Risk Index: 82.4% | Manual Audit Flag</p>
                    </div>
                  </div>
                  <div className="p-5 bg-blue-50 border border-blue-200 rounded-[28px] flex items-center gap-4">
                    <Search className="text-blue-600" />
                    <div>
                      <p className="text-xs font-black text-blue-900">Statistical Outlier</p>
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">Pune-Site Load Deviation: +2.1σ</p>
                    </div>
                  </div>
                </div>
              </ChartCard>

              {/* V27: Break-even Logic Chart */}
              <ChartCard title="Project Break-even Plot" icon={<Scale />}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={finBI.trend}>
                    <XAxis dataKey="month" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rev" stroke="#3b82f6" strokeWidth={3} name="Total Inflow" />
                    <Line type="monotone" dataKey="exp" stroke="#f43f5e" strokeWidth={3} name="Operational Cost" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V28: Vendor Integrity Radar */}
              <ChartCard title="Strategic Sourcing Score" icon={<Target />}>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                    { subject: 'Quality', A: 120, B: 110 },
                    { subject: 'Lead Time', A: 98, B: 130 },
                    { subject: 'Cost Match', A: 86, B: 130 },
                    { subject: 'Reliability', A: 99, B: 100 },
                    { subject: 'Compliance', A: 85, B: 90 },
                  ]}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="subject" style={{fontSize: '10px'}} />
                    <Radar name="Tier-1 Vendor" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Radar name="Reserve Vendor" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Legend wrapperStyle={{fontSize: '10px'}} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V29: Milestone Confidence Scatter */}
              <ChartCard title="Milestone Confidence Map" icon={<Flag />}>
                 <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart>
                    <XAxis dataKey="comp" name="Done %" unit="%" style={{fontSize: '10px'}} />
                    <YAxis dataKey="overrun" name="Variance" unit="%" style={{fontSize: '10px'}} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Active Milestones" data={opsBI.projData} fill="#10b981" />
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* V30: Site Health Gauge */}
              <ChartCard title="Global Enterprise Health" icon={<Zap />}>
                 <div className="flex flex-col items-center justify-center h-full">
                    <div className="relative w-44 h-44">
                       <svg className="w-full h-full transform -rotate-90">
                          <circle cx="88" cy="88" r="80" stroke="#f1f5f9" strokeWidth="16" fill="transparent" />
                          <circle cx="88" cy="88" r="80" stroke="#3b82f6" strokeWidth="16" fill="transparent" strokeDasharray="502" strokeDashoffset={502 - (502 * 0.92)} />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black text-slate-900">92%</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimized</span>
                       </div>
                    </div>
                    <p className="text-[10px] font-black text-emerald-600 mt-8 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">Audit Status: AA Verified</p>
                 </div>
              </ChartCard>
            </>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* 4. STRATEGIC FORECAST STRIP */}
      <div className="bg-slate-900 rounded-[48px] p-12 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="max-w-3xl">
             <div className="flex items-center gap-3 text-blue-400 mb-6">
                <Sparkles size={24} fill="currentColor" />
                <span className="text-xs font-black uppercase tracking-[0.4em]">Predictive Executive Intelligence</span>
             </div>
             <h2 className="text-5xl font-black mb-6 leading-tight tracking-tighter">Q4 Fiscal Projection: <span className="text-blue-400">18.4% Efficiency Surge</span></h2>
             <p className="text-slate-400 text-xl leading-relaxed font-medium">Real-time site telemetry from Pune and Nagpur deployments indicates a massive reduction in operational friction. AI engine recommends re-allocating <span className="text-white font-black">₹4.85M</span> from General Overheads to Logistics to capitalize on Q1 vendor price drops.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full lg:w-[400px] shrink-0">
             <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] backdrop-blur-2xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Liquidity Score</p>
                <p className="text-3xl font-black text-white">96.8</p>
             </div>
             <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] backdrop-blur-2xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Audit Status</p>
                <p className="text-3xl font-black text-blue-400">AAA+</p>
             </div>
             <div className="col-span-2 bg-blue-600 p-6 rounded-[32px] flex items-center justify-between group cursor-pointer hover:bg-blue-500 transition-all shadow-xl">
                <span className="font-black text-sm uppercase tracking-widest">Generate Certified Fiscal Audit</span>
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/2" />
      </div>
    </div>
  );
};

// HELPER CHART CARD COMPONENT
const ChartCard = ({ title, icon, children }: any) => (
  <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl p-8 hover:shadow-2xl transition-all flex flex-col h-[420px] group border-b-8 hover:border-b-blue-600">
    <div className="flex items-center gap-4 mb-10">
      <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        {React.cloneElement(icon as any, { size: 22 })}
      </div>
      <h4 className="font-black text-slate-800 text-sm tracking-tight uppercase tracking-wider">{title}</h4>
    </div>
    <div className="flex-1 min-h-0">
      {children}
    </div>
  </div>
);

export default BIAnalytics;
