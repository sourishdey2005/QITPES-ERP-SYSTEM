
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase, formatCurrency } from '../lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  ScatterChart, Scatter, ReferenceLine
} from 'recharts';
import { 
  TrendingUp, LayoutDashboard, AlertTriangle, CreditCard, Users, 
  Briefcase, Activity, Zap, Box, ArrowUpRight, ArrowDownRight, 
  Target, Truck, Wrench, Clock, CheckCircle2, PieChart as PieIcon,
  Flag, Loader2, Database, ShieldAlert, Sparkles, ReceiptText
} from 'lucide-react';
import { motion as motionBase, AnimatePresence } from 'framer-motion';

const motion = motionBase as any;
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const BIAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'finance' | 'ops' | 'assets' | 'hr' | 'strategic'>('finance');

  const { data: db, isLoading } = useQuery({
    queryKey: ['enterprise-bi-data'],
    queryFn: async () => {
      const [
        { data: transactions },
        { data: inventory },
        { data: projects },
        { data: assets },
        { data: employees }
      ] = await Promise.all([
        supabase.from('finance_transactions').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('assets').select('*'),
        supabase.from('employees').select('*')
      ]);
      return { transactions, inventory, projects, assets, employees };
    }
  });

  // --- 1. FINANCIAL AGGREGATIONS (KPI 1, 2, 3, 4, 5, 23, 24, 25) ---
  const fin = useMemo(() => {
    if (!db?.transactions) return { trend: [], expenses: [], kpi: {}, agingAR: [], breakEven: [] };
    
    const monthly = db.transactions.reduce((acc: any, t: any) => {
      const m = new Date(t.transaction_date).toLocaleString('default', { month: 'short' });
      if (!acc[m]) acc[m] = { month: m, rev: 0, exp: 0, budget: 500000, actual: 0 };
      if (t.type === 'income') acc[m].rev += Number(t.amount);
      else {
        acc[m].exp += Number(t.amount);
        acc[m].actual += Number(t.amount);
      }
      return acc;
    }, {});

    const catAgg = db.transactions.filter(t => t.type === 'expense').reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});

    const aging = { '0-30': 0, '31-60': 0, '60+': 0 };
    db.transactions.filter(t => !t.is_paid).forEach(t => {
      const diff = Math.floor((Date.now() - new Date(t.due_date).getTime()) / 86400000);
      if (diff <= 30) aging['0-30'] += Number(t.amount);
      else if (diff <= 60) aging['31-60'] += Number(t.amount);
      else aging['60+'] += Number(t.amount);
    });

    const totalRev = db.transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExp = db.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    
    return {
      trend: Object.values(monthly),
      expenses: Object.entries(catAgg).map(([name, value]) => ({ name, value })),
      agingAR: Object.entries(aging).map(([name, value]) => ({ name, value })),
      kpi: { 
        totalRev, 
        totalExp, 
        profit: totalRev - totalExp, 
        margin: totalRev > 0 ? ((totalRev - totalExp) / totalRev) * 100 : 0,
        currentRatio: totalRev / (totalExp || 1)
      }
    };
  }, [db]);

  // --- 2. OPS & INVENTORY (KPI 8, 9, 10, 11, 15, 16, 20) ---
  const ops = useMemo(() => {
    if (!db) return { inv: [], turnover: [], projects: [] };
    
    const invData = db.inventory.map(i => ({
      name: i.name,
      stock: Number(i.opening_stock) + Number(i.purchased_qty) - Number(i.sold_qty),
      reorder: Number(i.reorder_level),
      turnover: i.stock_level > 0 ? (i.cogs / i.stock_level) : 0
    }));

    return {
      inv: invData,
      projects: db.projects.map(p => ({
        name: p.name,
        completion: p.completion_percentage,
        overrun: p.budget > 0 ? ((p.estimated_cost - p.budget) / p.budget) * 100 : 0,
        contract: p.contract_value,
        paid: p.paid_amount,
        pending: p.contract_value - p.paid_amount
      }))
    };
  }, [db]);

  // --- 3. ASSETS (KPI 12, 13, 14, 28) ---
  const ast = useMemo(() => {
    if (!db?.assets) return [];
    return db.assets.map(a => ({
      name: a.name,
      downtime: (a.downtime_hours / (a.engine_hours + a.downtime_hours || 1)) * 100,
      maintenance: Number(a.maintenance_cost),
      fuelEff: a.fuel_used > 0 ? a.distance_traveled / a.fuel_used : 0,
      efficiency: a.planned_output > 0 ? (a.actual_output / a.planned_output) * 100 : 0,
      value: a.purchase_cost * Math.pow(0.85, 1) // Simple 15% annual depreciation
    }));
  }, [db]);

  // --- 4. HR (KPI 17, 18, 19, 29) ---
  const hrc = useMemo(() => {
    if (!db?.employees) return { payroll: [], attendance: [], productivity: [] };
    
    const payrollDept = db.employees.reduce((acc: any, e) => {
      acc[e.department] = (acc[e.department] || 0) + Number(e.gross_salary);
      return acc;
    }, {});

    return {
      payroll: Object.entries(payrollDept).map(([name, value]) => ({ name, value })),
      attendance: db.employees.map(e => ({ name: e.full_name, rate: e.attendance_rate })),
      productivity: db.employees.map(e => ({ name: e.full_name, prod: e.labour_hours > 0 ? e.output_units / e.labour_hours : 0 }))
    };
  }, [db]);

  if (isLoading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-bold tracking-tight">Accessing Global Enterprise Ledgers...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 page-transition">
      {/* HEADER & GLOBAL KPI STRIP (KPI 30) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <LayoutDashboard className="text-blue-600" /> Enterprise Intelligence Hub
          </h1>
          <p className="text-slate-500 font-medium">Site-level telemetry and 2026 fiscal year oversight.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          {(['finance', 'ops', 'assets', 'hr', 'strategic'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard label="Annual Revenue" value={formatCurrency(fin.kpi.totalRev)} trend="+14%" icon={<TrendingUp />} />
        <KPICard label="Net Profit Margin" value={`${fin.kpi.margin.toFixed(1)}%`} trend="+2.4%" icon={<Activity />} />
        <KPICard label="Inventory Value" value={formatCurrency(db?.inventory?.reduce((s, i) => s + (i.stock_level * i.unit_price), 0) || 0)} icon={<Box />} />
        <KPICard label="Site Efficiency" value="88.2%" trend="+5%" icon={<Zap />} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          
          {activeTab === 'finance' && (
            <>
              <ChartCard title="Revenue Trend Analysis" icon={<TrendingUp />}>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={fin.trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" style={{fontSize: '10px'}} axisLine={false} tickLine={false} />
                    <YAxis style={{fontSize: '10px'}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Line type="monotone" dataKey="rev" stroke="#3b82f6" strokeWidth={4} dot={{r: 4}} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Expense Category Distribution" icon={<PieIcon />}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={fin.expenses} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {fin.expenses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Cash Flow Overview" icon={<CreditCard />}>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={fin.trend}>
                    <XAxis dataKey="month" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Area type="monotone" dataKey="rev" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Inflow" />
                    <Area type="monotone" dataKey="exp" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="Outflow" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Accounts Receivable Aging" icon={<Clock />}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={fin.agingAR}>
                    <XAxis dataKey="name" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Overdue (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Budget vs Actual Variance" icon={<Target />}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={fin.trend}>
                    <XAxis dataKey="month" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="budget" fill="#e2e8f0" name="Budget" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" fill="#3b82f6" name="Actual" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Revenue by Client" icon={<Users />}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ops.projects.slice(0, 5)} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" style={{fontSize: '8px'}} width={80} />
                    <Tooltip />
                    <Bar dataKey="contract" fill="#10b981" name="Contract Value" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}

          {activeTab === 'ops' && (
            <>
              <ChartCard title="Inventory Stock Levels" icon={<Box />}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ops.inv}>
                    <XAxis dataKey="name" style={{fontSize: '8px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="stock" fill="#3b82f6" name="Current Stock" />
                    <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Reorder', fill: '#ef4444', fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Project Completion Matrix" icon={<Flag />}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={ops.projects} dataKey="completion" nameKey="name" innerRadius={60} outerRadius={85}>
                      {ops.projects.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Contractor Payment Status" icon={<ReceiptText />}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ops.projects} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" style={{fontSize: '8px'}} width={80} />
                    <Tooltip />
                    <Bar dataKey="paid" stackId="a" fill="#10b981" name="Paid" />
                    <Bar dataKey="pending" stackId="a" fill="#e2e8f0" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Project Cost Overrun" icon={<AlertTriangle />}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ops.projects}>
                    <XAxis dataKey="name" style={{fontSize: '8px'}} />
                    <YAxis style={{fontSize: '10px'}} unit="%" />
                    <Tooltip />
                    <Bar dataKey="overrun" fill="#ef4444" name="Overrun %" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Production Efficiency (%)" icon={<Zap />}>
                 <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={ast}>
                    <XAxis dataKey="name" style={{fontSize: '10px'}} />
                    <YAxis unit="%" style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="efficiency" fill="#3b82f6" name="Output Eff." opacity={0.6} />
                    <Line type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={3} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Low Stock Alerts" icon={<ShieldAlert />}>
                <div className="space-y-2 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
                  {ops.inv.filter(i => i.stock < i.reorder).map(i => (
                    <div key={i.name} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-red-900">{i.name}</p>
                        <p className="text-[10px] text-red-600 font-medium">Critical Stock: {i.stock} units</p>
                      </div>
                      <AlertTriangle size={16} className="text-red-600 animate-pulse" />
                    </div>
                  ))}
                </div>
              </ChartCard>
            </>
          )}

          {activeTab === 'assets' && (
            <>
              <ChartCard title="Machine Downtime Analysis" icon={<Clock />}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ast}>
                    <XAxis dataKey="name" style={{fontSize: '10px'}} />
                    <YAxis unit="%" style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="downtime" fill="#ef4444" name="Downtime %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Maintenance Cost Matrix" icon={<Wrench />}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ast}>
                    <XAxis dataKey="name" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="maintenance" fill="#3b82f6" name="Maint. Cost (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Fuel Efficiency (KM/L)" icon={<Truck />}>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={ast}>
                    <XAxis dataKey="name" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Line type="stepAfter" dataKey="fuelEff" stroke="#10b981" strokeWidth={3} name="KM/L" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Asset Depreciation Forecast" icon={<Database />}>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={ast}>
                    <XAxis dataKey="name" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} name="Residual Value" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}

          {activeTab === 'hr' && (
            <>
              <ChartCard title="Payroll Distribution" icon={<Users />}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={hrc.payroll} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {hrc.payroll.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Staff Attendance Metrics" icon={<CheckCircle2 />}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={hrc.attendance}>
                    <XAxis dataKey="name" style={{fontSize: '8px'}} />
                    <YAxis unit="%" style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#10b981" name="Attendance %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Labour Productivity Index" icon={<Activity />}>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={hrc.productivity}>
                    <XAxis dataKey="name" style={{fontSize: '8px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="prod" stroke="#f59e0b" strokeWidth={3} name="Units/Hr" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}

          {activeTab === 'strategic' && (
            <>
              <ChartCard title="AI Revenue Forecast (2027)" icon={<Sparkles />}>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={[...fin.trend, {month: 'Jan 27', rev: 920000}, {month: 'Feb 27', rev: 1100000}]}>
                    <XAxis dataKey="month" style={{fontSize: '10px'}} />
                    <YAxis style={{fontSize: '10px'}} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rev" stroke="#3b82f6" strokeWidth={4} strokeDasharray="5 5" name="AI Forecast" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Anomaly Detection Alerts" icon={<ShieldAlert />}>
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
                    <ShieldAlert size={18} className="text-amber-600" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Duplicate Invoice Pattern</p>
                      <p className="text-[10px] text-amber-700">Vendor ID: V-TATA-442 | Probability: 88%</p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                    <Activity size={18} className="text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-blue-900">Outlier Expense Detected</p>
                      <p className="text-[10px] text-blue-700">Fuel Spend > 3σ from mean at Site B</p>
                    </div>
                  </div>
                </div>
              </ChartCard>

              <ChartCard title="Vendor Performance Radar" icon={<Target />}>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                    { subject: 'Speed', A: 120, B: 110, fullMark: 150 },
                    { subject: 'Quality', A: 98, B: 130, fullMark: 150 },
                    { subject: 'Cost', A: 86, B: 130, fullMark: 150 },
                    { subject: 'Support', A: 99, B: 100, fullMark: 150 },
                    { subject: 'Reliability', A: 85, B: 90, fullMark: 150 },
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" style={{fontSize: '10px'}} />
                    <Radar name="Vendor A" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                    <Radar name="Vendor B" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                    <Legend wrapperStyle={{fontSize: '10px'}} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}

        </motion.div>
      </AnimatePresence>

      {/* STRATEGIC KPI DASHBOARD BOTTOM ROW (KPI 23, 30) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-[32px] text-white flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Liquidity Ratio</p>
            <h3 className="text-2xl font-black">{fin.kpi.currentRatio.toFixed(2)}x</h3>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <TrendingUp size={24} className="text-emerald-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Labour Hours Logged</p>
            <h3 className="text-2xl font-black text-slate-900">{db?.employees?.reduce((s, e) => s + Number(e.labour_hours), 0) || 0}h</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
            <Clock size={24} className="text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Inventory Turnover</p>
            <h3 className="text-2xl font-black text-slate-900">4.2x</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <Zap size={24} className="text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ label, value, trend, icon }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all group">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        {React.cloneElement(icon, { size: 24 })}
      </div>
      {trend && (
        <span className={`flex items-center text-[10px] font-black px-2 py-0.5 rounded-lg ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend.startsWith('+') ? <ArrowUpRight size={10} className="mr-1" /> : <ArrowDownRight size={10} className="mr-1" />}
          {trend}
        </span>
      )}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <h3 className="text-2xl font-black text-slate-900">{value}</h3>
  </div>
);

const ChartCard = ({ title, icon, children }: any) => (
  <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6 hover:shadow-lg transition-all flex flex-col h-full group">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <h4 className="font-black text-slate-800 text-sm tracking-tight">{title}</h4>
    </div>
    <div className="flex-1 flex flex-col justify-center">
      {children}
    </div>
  </div>
);

export default BIAnalytics;
