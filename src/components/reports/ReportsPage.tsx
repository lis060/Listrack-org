import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  Users, 
  CheckSquare, 
  Calendar,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Clock,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Search,
  ChevronDown,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Cell,
  Pie,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Sale, Expense, Task, SavingsEntry, Client } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, label, prefix = '$' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 p-4 shadow-2xl rounded-2xl">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-sm font-black text-slate-900">
              {prefix}{entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ReportsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [savings, setSavings] = useState<SavingsEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedClient, setSelectedClient] = useState('all');

  useEffect(() => {
    if (!user) return;

    const unsubSales = onSnapshot(query(collection(db, 'sales'), orderBy('date', 'desc')), (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[]);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'sales'));

    const unsubExpenses = onSnapshot(query(collection(db, 'expenses'), orderBy('date', 'desc')), (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[]);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'expenses'));

    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[]);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'tasks'));

    const unsubSavings = onSnapshot(collection(db, 'savings'), (snapshot) => {
      setSavings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SavingsEntry[]);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'savings'));

    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[]);
      setIsLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'clients'));

    return () => {
      unsubSales();
      unsubExpenses();
      unsubTasks();
      unsubSavings();
      unsubClients();
    };
  }, [user]);

  // Filtered Data
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const dateMatch = (!dateRange.start || sale.date >= dateRange.start) && 
                        (!dateRange.end || sale.date <= dateRange.end);
      const monthMatch = selectedMonth === 'all' || sale.date.includes(selectedMonth);
      const categoryMatch = selectedCategory === 'all' || sale.category === selectedCategory;
      const clientMatch = selectedClient === 'all' || sale.customerName === selectedClient;
      return dateMatch && monthMatch && categoryMatch && clientMatch;
    });
  }, [sales, dateRange, selectedMonth, selectedCategory, selectedClient]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const dateMatch = (!dateRange.start || expense.date >= dateRange.start) && 
                        (!dateRange.end || expense.date <= dateRange.end);
      const monthMatch = selectedMonth === 'all' || expense.date.includes(selectedMonth);
      const categoryMatch = selectedCategory === 'all' || expense.category === selectedCategory;
      return dateMatch && monthMatch && categoryMatch;
    });
  }, [expenses, dateRange, selectedMonth, selectedCategory]);

  // Calculations
  const totalSales = filteredSales.reduce((sum, s) => sum + s.amount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalProfit = totalSales - totalExpenses;
  const totalSaved = savings.reduce((sum, s) => sum + s.savedAmount, 0);
  const totalTarget = savings.reduce((sum, s) => sum + s.targetAmount, 0);
  const totalClients = clients.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
  const taskCompletionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  // Chart Data
  const salesByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredSales.forEach(s => {
      categories[s.category] = (categories[s.category] || 0) + s.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [filteredSales]);

  const expensesByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const monthlyTrend = useMemo(() => {
    const months: Record<string, { sales: number; expenses: number; profit: number }> = {};
    
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toISOString().substring(0, 7); // YYYY-MM
      months[monthKey] = { sales: 0, expenses: 0, profit: 0 };
    }

    sales.forEach(s => {
      const m = s.date.substring(0, 7);
      if (months[m]) months[m].sales += s.amount;
    });

    expenses.forEach(e => {
      const m = e.date.substring(0, 7);
      if (months[m]) months[m].expenses += e.amount;
    });

    return Object.entries(months).map(([name, data]) => ({
      name,
      ...data,
      profit: data.sales - data.expenses
    }));
  }, [sales, expenses]);

  const topServices = useMemo(() => {
    const services: Record<string, number> = {};
    filteredSales.forEach(s => {
      services[s.serviceName] = (services[s.serviceName] || 0) + s.amount;
    });
    return Object.entries(services)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredSales]);

  const clientPerformance = useMemo(() => {
    const clientData: Record<string, { sales: number; count: number }> = {};
    sales.forEach(s => {
      if (!clientData[s.customerName]) {
        clientData[s.customerName] = { sales: 0, count: 0 };
      }
      clientData[s.customerName].sales += s.amount;
      clientData[s.customerName].count += 1;
    });
    return Object.entries(clientData)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [sales]);

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto p-4">
        <div className="h-8 w-48 bg-slate-100 animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-24" />
          ))}
        </div>
        <Card className="animate-pulse h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports</h1>
          <p className="text-muted-foreground mt-1">View business performance, trends, and summaries in one place</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-500/20">
          <Download className="w-4 h-4" />
          Export All Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { title: 'Total Sales', value: totalSales, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { title: 'Total Expenses', value: totalExpenses, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
          { title: 'Total Profit', value: totalProfit, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { title: 'Total Savings', value: totalSaved, icon: PiggyBank, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { title: 'Total Clients', value: totalClients, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', isCurrency: false },
          { title: 'Completed Tasks', value: completedTasks, icon: CheckSquare, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', isCurrency: false },
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={cn("border shadow-sm hover:shadow-md transition-all group overflow-hidden relative", stat.border)}>
              <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 blur-2xl", stat.bg)} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.title}</CardTitle>
                <div className={cn("p-2 rounded-xl border shadow-sm", stat.bg, stat.border)}>
                  <stat.icon className={cn("w-4 h-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {stat.isCurrency === false ? stat.value : `$${stat.value.toLocaleString()}`}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Current Period</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-lg bg-white overflow-visible">
        <CardHeader className="pb-4 border-b border-slate-50 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Filter className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-900">Report Filters</CardTitle>
              <p className="text-[10px] text-slate-400 font-medium">Refine your data view</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600"
            onClick={() => {
              setDateRange({ start: '', end: '' });
              setSelectedMonth('all');
              setSelectedCategory('all');
              setSelectedClient('all');
            }}
          >
            Reset Filters
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Date Range</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input 
                    type="date" 
                    className="h-10 text-xs pl-9 bg-slate-50/50 border-slate-200 focus:bg-white transition-all" 
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input 
                    type="date" 
                    className="h-10 text-xs pl-9 bg-slate-50/50 border-slate-200 focus:bg-white transition-all" 
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-10 text-xs bg-slate-50/50 border-slate-200 focus:bg-white transition-all">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const val = d.toISOString().substring(0, 7);
                    const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                    return <SelectItem key={val} value={val}>{label}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-10 text-xs bg-slate-50/50 border-slate-200 focus:bg-white transition-all">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.from(new Set([...sales.map(s => s.category), ...expenses.map(e => e.category)])).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Client</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="h-10 text-xs bg-slate-50/50 border-slate-200 focus:bg-white transition-all">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {Array.from(new Set(sales.map(s => s.customerName))).map(client => (
                    <SelectItem key={client} value={client}>{client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales & Expenses Charts */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Sales Report */}
        <Card className="border-slate-200 shadow-lg overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Sales Report
                </CardTitle>
                <CardDescription>Revenue analysis and trends</CardDescription>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                ${totalSales.toLocaleString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorSales)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Sales by Category</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesByCategory}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {salesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Top Services</h4>
                <div className="space-y-3">
                  {topServices.map((service, i) => (
                    <div key={service.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs font-medium text-slate-600 truncate max-w-[120px]">{service.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-900">${service.value.toLocaleString()}</span>
                    </div>
                  ))}
                  {topServices.length === 0 && <p className="text-xs text-slate-400 italic">No data available</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Report */}
        <Card className="border-slate-200 shadow-lg overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                  Expenses Report
                </CardTitle>
                <CardDescription>Cost analysis and distribution</CardDescription>
              </div>
              <Badge className="bg-rose-50 text-rose-700 border-rose-200">
                ${totalExpenses.toLocaleString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc', radius: 8 }}
                    content={<CustomTooltip prefix="-$" />} 
                  />
                  <Bar 
                    dataKey="expenses" 
                    fill="#ef4444" 
                    radius={[6, 6, 0, 0]} 
                    barSize={32} 
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Expense Categories</h4>
              <div className="grid grid-cols-2 gap-4">
                {expensesByCategory.map((cat, i) => (
                  <div key={cat.name} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-600">${cat.value.toLocaleString()}</span>
                  </div>
                ))}
                {expensesByCategory.length === 0 && <p className="text-xs text-slate-400 italic">No data available</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit & Savings */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profit Report */}
        <Card className="lg:col-span-2 border-slate-200 shadow-lg overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-600" />
              Profit Analysis
            </CardTitle>
            <CardDescription>Net income performance over time</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#4f46e5" 
                    strokeWidth={5} 
                    dot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }} 
                    activeDot={{ r: 8, strokeWidth: 0 }} 
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Savings Report */}
        <Card className="border-slate-200 shadow-lg overflow-hidden bg-white flex flex-col">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-blue-600" />
              Savings Goals
            </CardTitle>
            <CardDescription>Target achievement tracking</CardDescription>
          </CardHeader>
          <CardContent className="p-8 flex-1 flex flex-col justify-center space-y-8">
            <div className="space-y-2 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Saved</p>
              <p className="text-5xl font-black text-blue-600 tracking-tighter">${totalSaved.toLocaleString()}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 uppercase tracking-tight">Progress</span>
                <span className="text-blue-600">{(totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0).toFixed(1)}%</span>
              </div>
              <Progress value={totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0} className="h-4 bg-slate-100 rounded-full" indicatorClassName="bg-blue-600 shadow-sm" />
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>$0</span>
                <span>Target: ${totalTarget.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Remaining to Goal</span>
                <span className="text-sm font-bold text-rose-600">${Math.max(0, totalTarget - totalSaved).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Entries</span>
                <span className="text-sm font-bold text-slate-900">{savings.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients & Tasks */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Client Performance */}
        <Card className="border-slate-200 shadow-lg overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-6">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600" />
              Client Performance
            </CardTitle>
            <CardDescription>Top clients by revenue contribution</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-14 px-6">Client Name</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-14 text-center">Total Sales</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-14 text-right px-6">Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientPerformance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No client data available</TableCell>
                  </TableRow>
                ) : (
                  clientPerformance.map((client) => (
                    <TableRow key={client.name} className="hover:bg-violet-50/40 transition-all border-b border-slate-50">
                      <TableCell className="px-6 py-4 font-bold text-slate-900">{client.name}</TableCell>
                      <TableCell className="text-center py-4">
                        <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-100">
                          {client.count} Sales
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-6 py-4 font-mono font-bold text-slate-900">
                        ${client.sales.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Task Report */}
        <Card className="border-slate-200 shadow-lg overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-6">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-600" />
              Task Performance
            </CardTitle>
            <CardDescription>Efficiency and completion metrics</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Completion Rate</p>
                <p className="text-3xl font-black text-slate-900">{taskCompletionRate.toFixed(1)}%</p>
              </div>
              <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Overdue Tasks</p>
                <p className="text-3xl font-black text-rose-600">{overdueTasks}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-600">Completed</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{completedTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-slate-600">Pending</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{pendingTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600">Total Tasks</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{tasks.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid gap-8">
        {/* Recent Sales Report Table */}
        <Card className="border-slate-200 shadow-xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-6 px-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Detailed Sales Report</CardTitle>
                <CardDescription>Comprehensive list of recent transactions</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="text-[10px] font-bold uppercase tracking-widest gap-2">
                <Download className="w-3 h-3" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-14 px-8">Date</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-14">Client</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-14">Service</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-14">Category</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-14 text-right px-8">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 text-slate-200" />
                          <p className="text-sm font-medium">No sales found for selected filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSales.slice(0, 10).map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-slate-50/80 transition-all border-b border-slate-50 group">
                        <TableCell className="px-8 py-5 text-xs font-bold text-slate-400">{sale.date}</TableCell>
                        <TableCell className="py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{sale.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Verified Client</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-5 text-sm font-medium text-slate-600">{sale.serviceName}</TableCell>
                        <TableCell className="py-5">
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border-slate-200">
                            {sale.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-8 py-5">
                          <span className="font-mono font-black text-emerald-600 text-base">
                            ${sale.amount.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses Report Table */}
        <Card className="border-slate-200 shadow-xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-6 px-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Detailed Expenses Report</CardTitle>
                <CardDescription>Comprehensive list of recent expenditures</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="text-[10px] font-bold uppercase tracking-widest gap-2">
                <Download className="w-3 h-3" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-14 px-8">Date</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-14">Expense Name</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-14">Category</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-14 text-right px-8">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 text-slate-200" />
                          <p className="text-sm font-medium">No expenses found for selected filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.slice(0, 10).map((expense) => (
                      <TableRow key={expense.id} className="hover:bg-slate-50/80 transition-all border-b border-slate-50 group">
                        <TableCell className="px-8 py-5 text-xs font-bold text-slate-400">{expense.date}</TableCell>
                        <TableCell className="py-5 font-bold text-slate-900">{expense.name}</TableCell>
                        <TableCell className="py-5">
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border-slate-200">
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-8 py-5">
                          <span className="font-mono font-black text-rose-600 text-base">
                            -${expense.amount.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
