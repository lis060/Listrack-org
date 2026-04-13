import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckSquare,
  PiggyBank,
  Wallet,
  Calendar,
  Clock,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { Sale, Expense, Task, SavingsEntry, Client, Page } from '@/types';

interface OverviewProps {
  onPageChange?: (page: Page) => void;
}

export function Overview({ onPageChange }: OverviewProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [savings, setSavings] = useState<SavingsEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (!user) return;

    const unsubSales = onSnapshot(query(collection(db, 'sales'), orderBy('date', 'desc'), limit(5)), (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sales');
    });

    const unsubExpenses = onSnapshot(query(collection(db, 'expenses'), orderBy('date', 'desc'), limit(5)), (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'expenses');
    });

    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'desc'), limit(5)), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tasks');
    });

    const unsubSavings = onSnapshot(collection(db, 'savings'), (snapshot) => {
      setSavings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SavingsEntry[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'savings');
    });

    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[]);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'clients');
      setIsLoading(false);
    });

    return () => {
      unsubSales();
      unsubExpenses();
      unsubTasks();
      unsubSavings();
      unsubClients();
    };
  }, [user]);

  const totalSalesAmount = sales.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpensesAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalProfit = totalSalesAmount - totalExpensesAmount;
  const totalSaved = savings.reduce((acc, curr) => acc + curr.savedAmount, 0);
  const totalTarget = savings.reduce((acc, curr) => acc + curr.targetAmount, 0);
  const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;
  const totalClientsCount = clients.length;

  const savingsProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const savingsRemaining = Math.max(0, totalTarget - totalSaved);

  const upcomingFollowUps = clients
    .filter(c => c.followUpDate && new Date(c.followUpDate) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime())
    .slice(0, 5);

  const stats = [
    { 
      title: 'Total Sales', 
      value: `$${totalSalesAmount.toLocaleString()}`, 
      change: 'Real-time', 
      trend: 'up', 
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    { 
      title: 'Total Expenses', 
      value: `$${totalExpensesAmount.toLocaleString()}`, 
      change: 'Real-time', 
      trend: 'down', 
      icon: TrendingDown,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    },
    { 
      title: 'Total Profit', 
      value: `$${totalProfit.toLocaleString()}`, 
      change: 'Real-time', 
      trend: 'up', 
      icon: Wallet,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    { 
      title: 'Total Savings', 
      value: `$${totalSaved.toLocaleString()}`, 
      change: `${savingsProgress.toFixed(1)}% of goal`, 
      trend: 'up', 
      icon: PiggyBank,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    { 
      title: 'Pending Tasks', 
      value: pendingTasksCount.toString(), 
      change: 'Active tasks', 
      trend: 'up', 
      icon: CheckSquare,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    { 
      title: 'Total Clients', 
      value: totalClientsCount.toString(), 
      change: 'In directory', 
      trend: 'up', 
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-50'
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-100 animate-pulse rounded" />
            <div className="h-4 w-64 bg-slate-50 animate-pulse rounded" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-slate-100 rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-slate-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="animate-pulse h-[300px]" />
          <Card className="animate-pulse h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your sales, expenses, tasks, savings, and clients</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 gap-2"
            onClick={() => onPageChange?.('sales')}
          >
            <Plus className="w-4 h-4" />
            New Entry
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className={cn("absolute right-[-10%] top-[-10%] opacity-[0.03] group-hover:scale-110 transition-transform duration-500", stat.color)}>
                <stat.icon size={80} />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.title}</CardTitle>
                <div className={cn("p-1.5 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-rose-600" />
                  )}
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-tighter",
                    stat.trend === 'up' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {stat.change}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Recent Sales */}
        <Card className="xl:col-span-2 border-slate-200 shadow-lg overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-4 md:py-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg md:text-xl font-bold text-slate-900">Recent Sales</CardTitle>
                <CardDescription className="text-slate-500 hidden sm:block">Latest revenue generating activities.</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-indigo-600 font-bold text-[10px] md:text-xs uppercase tracking-widest gap-2 hover:bg-indigo-50 transition-all"
                onClick={() => onPageChange?.('sales')}
              >
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-12 md:h-14 px-4 md:px-6">Date</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-12 md:h-14">Service</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-12 md:h-14 hidden sm:table-cell">Client</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-12 md:h-14 text-right">Amount</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-12 md:h-14 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No recent sales</TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => (
                      <TableRow key={sale.id} className="group hover:bg-indigo-50/40 transition-all duration-200 border-b border-slate-50">
                        <TableCell className="px-4 md:px-6 py-4 md:py-5">
                          <div className="flex items-center gap-2.5">
                            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-slate-100 items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">{sale.date}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 md:py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{sale.serviceName}</span>
                            <span className="text-[10px] text-slate-400 sm:hidden">{sale.customerName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 md:py-5 hidden sm:table-cell">
                          <span className="text-xs font-medium text-slate-500">{sale.customerName}</span>
                        </TableCell>
                        <TableCell className="py-4 md:py-5 text-right">
                          <span className="text-sm font-mono font-bold text-slate-900">${sale.amount.toLocaleString()}</span>
                        </TableCell>
                        <TableCell className="py-4 md:py-5 text-center">
                          <Badge className={cn(
                            "px-2 py-0.5 h-5 md:h-6 text-[8px] md:text-[9px] font-bold uppercase tracking-widest border",
                            sale.paymentStatus === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                          )}>
                            {sale.paymentStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Savings Progress */}
        <Card className="border-slate-200 shadow-lg overflow-hidden flex flex-col bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-6">
            <CardTitle className="text-xl font-bold text-slate-900">Savings Progress</CardTitle>
            <CardDescription className="text-slate-500">Current target achievement.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Saved</p>
                <p className="text-4xl font-bold text-blue-600 tracking-tight">${totalSaved.toLocaleString()}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-inner">
                <PiggyBank className="w-7 h-7 text-blue-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-tight">{savingsProgress.toFixed(1)}% Complete</span>
                <span className="text-slate-400 font-bold uppercase tracking-tighter">${savingsRemaining.toLocaleString()} to go</span>
              </div>
              <Progress value={savingsProgress} className="h-3 bg-slate-100 rounded-full" indicatorClassName="bg-blue-600" />
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Goal</p>
                <p className="text-base font-mono font-bold text-slate-800">${totalTarget.toLocaleString()}</p>
              </div>
              <div className="space-y-1.5 text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Entries</p>
                <p className="text-base font-mono font-bold text-slate-800">{savings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="xl:col-span-2 border-slate-200 shadow-lg overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-4 md:py-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg md:text-xl font-bold text-slate-900">Upcoming Tasks</CardTitle>
                <CardDescription className="text-slate-500 hidden sm:block">Pending items requiring attention.</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-amber-600 font-bold text-[10px] md:text-xs uppercase tracking-widest gap-2 hover:bg-amber-50 transition-all"
                onClick={() => onPageChange?.('tasks')}
              >
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-12 md:h-14 px-4 md:px-6">Task</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-12 md:h-14 hidden sm:table-cell">Client</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-12 md:h-14">Deadline</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-12 md:h-14 text-center">Priority</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-12 md:h-14 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No upcoming tasks</TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => {
                      const isOverdue = task.deadline && new Date(task.deadline) < new Date();
                      return (
                        <TableRow key={task.id} className="group hover:bg-amber-50/40 transition-all duration-200 border-b border-slate-50">
                          <TableCell className="px-4 md:px-6 py-4 md:py-5">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0 shadow-sm",
                                task.priority === 'high' ? "bg-rose-500" : task.priority === 'medium' ? "bg-amber-500" : "bg-emerald-500"
                              )} />
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 line-clamp-1">{task.title}</span>
                                <span className="text-[10px] text-slate-400 sm:hidden">{task.client || 'Internal'}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 md:py-5 hidden sm:table-cell">
                            <span className="text-xs font-medium text-slate-500">{task.client || 'Internal'}</span>
                          </TableCell>
                          <TableCell className="py-4 md:py-5">
                            <div className="flex items-center gap-2">
                              <Clock className={cn("w-3 h-3 md:w-3.5 md:h-3.5", isOverdue ? "text-rose-500" : "text-slate-400")} />
                              <span className={cn("text-[10px] md:text-xs font-bold", isOverdue ? "text-rose-600" : "text-slate-600")}>
                                {task.dueDate || task.deadline}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 md:py-5 text-center">
                            <Badge variant="outline" className={cn(
                              "px-1.5 md:px-2.5 py-0.5 h-5 md:h-6 text-[8px] md:text-[9px] font-bold uppercase tracking-widest border",
                              task.priority === 'high' ? "text-rose-600 border-rose-200 bg-rose-50/30" : task.priority === 'medium' ? "text-amber-600 border-amber-200 bg-amber-50/30" : "text-emerald-600 border-emerald-200 bg-emerald-50/30"
                            )}>
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 md:py-5 text-center">
                            <div className="flex justify-center">
                              <div className={cn(
                                "w-6 h-6 md:w-8 md:h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer",
                                task.status === 'completed' ? "bg-emerald-50 border-emerald-500" : "border-slate-200 group-hover:border-amber-500 group-hover:bg-amber-50"
                              )}>
                                <CheckCircle2 className={cn(
                                  "w-3 h-3 md:w-4 md:h-4 transition-colors",
                                  task.status === 'completed' ? "text-emerald-500" : "text-slate-200 group-hover:text-amber-500"
                                )} />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses & Client Summary */}
        <div className="space-y-6">
          {/* Upcoming Follow-ups */}
          <Card className="border-slate-200 shadow-lg overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-900">Follow-ups</CardTitle>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                  {upcomingFollowUps.length} Upcoming
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {upcomingFollowUps.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No upcoming follow-ups</div>
                ) : (
                  upcomingFollowUps.map((client) => {
                    const isToday = client.followUpDate === new Date().toISOString().split('T')[0];
                    return (
                      <div key={client.id} className="p-4 flex items-center justify-between hover:bg-indigo-50/40 transition-all duration-200 group">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
                            isToday ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-indigo-50 border-indigo-100 text-indigo-600"
                          )}>
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{client.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{client.businessName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-xs font-bold",
                            isToday ? "text-amber-600" : "text-slate-600"
                          )}>
                            {isToday ? 'Today' : client.followUpDate}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{client.service}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-4 border-t border-slate-50">
                <Button 
                  variant="ghost" 
                  className="w-full text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
                  onClick={() => onPageChange?.('clients')}
                >
                  View All Clients
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Client Summary */}
          <Card className="border-slate-200 shadow-lg overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-6">
              <CardTitle className="text-xl font-bold text-slate-900">Client Summary</CardTitle>
              <CardDescription className="text-slate-500">Customer base distribution.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center shadow-sm">
                  <p className="text-2xl font-bold text-emerald-700 tracking-tight">{clients.filter(c => c.status === 'Active').length}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mt-1">Active</p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center shadow-sm">
                  <p className="text-2xl font-bold text-blue-700 tracking-tight">{clients.filter(c => c.status === 'Lead').length}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mt-1">Leads</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center shadow-sm">
                  <p className="text-2xl font-bold text-slate-700 tracking-tight">{clients.filter(c => c.status === 'Completed').length}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mt-1">Done</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full text-xs font-bold uppercase tracking-widest h-12 gap-2 border-slate-200 hover:bg-slate-50 hover:text-indigo-600 transition-all"
                onClick={() => onPageChange?.('clients')}
              >
                <Users className="w-4 h-4" />
                Manage Directory
              </Button>
            </CardContent>
          </Card>

          {/* Recent Expenses Mini Table */}
          <Card className="border-slate-200 shadow-lg overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-slate-900">Recent Expenses</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-rose-600 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50"
                  onClick={() => onPageChange?.('expenses')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {expenses.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No recent expenses</div>
                ) : (
                  expenses.map((expense) => (
                    <div key={expense.id} className="p-5 flex items-center justify-between hover:bg-rose-50/40 transition-all duration-200 group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                          <TrendingDown className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{expense.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{expense.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-mono font-bold text-rose-600">-${expense.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{expense.date}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
