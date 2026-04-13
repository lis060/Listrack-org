import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle,
  Lightbulb,
  Zap,
  Star,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Sale, Expense, Task, SavingsEntry, Client } from '@/types';
import { generateBusinessSummary, AIInsightsData } from '@/services/geminiService';

export function AIInsights() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [savings, setSavings] = useState<SavingsEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [insights, setInsights] = useState<AIInsightsData | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubSales = onSnapshot(query(collection(db, 'sales'), orderBy('date', 'desc')), (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sales');
    });

    const unsubExpenses = onSnapshot(query(collection(db, 'expenses'), orderBy('date', 'desc')), (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'expenses');
    });

    const unsubTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[]);
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

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    try {
      const data = await generateBusinessSummary();
      setInsights(data);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate on first load if data is available
  useEffect(() => {
    if (!isLoading && !insights && !isGenerating && (sales.length > 0 || expenses.length > 0)) {
      handleGenerateInsights();
    }
  }, [isLoading, sales.length, expenses.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-500 font-medium">Loading business data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            AI Business Insights
          </h1>
          <p className="text-slate-500 mt-1">Strategic analysis and recommendations powered by Gemini AI.</p>
        </div>
        <Button 
          onClick={handleGenerateInsights} 
          disabled={isGenerating}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all duration-200 group"
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
          )}
          {isGenerating ? 'Analyzing Data...' : 'Refresh Insights'}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-24 space-y-6"
          >
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <Sparkles className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Gemini is analyzing your business...</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                We're processing your sales, expenses, and client data to generate personalized strategic recommendations.
              </p>
            </div>
          </motion.div>
        ) : insights ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Sales</p>
                      <p className="text-2xl font-bold text-slate-900">${insights.summary.totalSalesToday.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                      <TrendingDown className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today's Expenses</p>
                      <p className="text-2xl font-bold text-slate-900">${insights.summary.totalExpensesToday.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Profit Today</p>
                      <p className="text-2xl font-bold text-slate-900">${insights.summary.profitToday.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Tasks</p>
                      <p className="text-2xl font-bold text-slate-900">{insights.summary.pendingTasksCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Analysis & Summary Details */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="border-slate-200 shadow-lg overflow-hidden">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-6">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-indigo-600" />
                      AI Business Summary
                    </CardTitle>
                    <CardDescription>Detailed breakdown of your current business standing.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                            <Star className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">Top Service</p>
                            <p className="text-slate-500 text-sm">{insights.summary.topService}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">Top Client</p>
                            <p className="text-slate-500 text-sm">{insights.summary.topClient}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold text-slate-900">Savings Progress</p>
                          <span className="text-sm font-bold text-indigo-600">{insights.summary.savingsProgress.toFixed(1)}%</span>
                        </div>
                        <Progress value={insights.summary.savingsProgress} className="h-2" indicatorClassName="bg-indigo-600" />
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Current Monthly Target</p>
                      </div>
                    </div>

                    <div className="mt-10 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                      <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Strategic Analysis
                      </h4>
                      <p className="text-indigo-800/80 text-sm leading-relaxed italic">
                        "{insights.analysis}"
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Highlights */}
                <Card className="border-slate-200 shadow-lg overflow-hidden">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-6">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500" />
                      AI Performance Highlights
                    </CardTitle>
                    <CardDescription>Key milestones and top performers in your business history.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Best Day</p>
                        <p className="text-lg font-bold text-slate-900">{insights.highlights.bestPerformingDay}</p>
                      </div>
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Best Client</p>
                        <p className="text-lg font-bold text-slate-900">{insights.highlights.bestClient}</p>
                      </div>
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top Revenue Service</p>
                        <p className="text-lg font-bold text-slate-900">{insights.highlights.highestRevenueService}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Recommendations */}
              <div className="space-y-8">
                <Card className="border-slate-200 shadow-lg overflow-hidden h-full flex flex-col">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-6">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" />
                      AI Recommendations
                    </CardTitle>
                    <CardDescription>Actionable steps to grow your business.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 flex-1">
                    <div className="space-y-4">
                      {insights.recommendations.map((rec, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-default"
                        >
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                              rec.type === 'expense' ? "bg-rose-50 text-rose-600" :
                              rec.type === 'client' ? "bg-blue-50 text-blue-600" :
                              rec.type === 'service' ? "bg-emerald-50 text-emerald-600" :
                              "bg-slate-50 text-slate-600"
                            )}>
                              {rec.type === 'expense' ? <TrendingDown className="w-5 h-5" /> :
                               rec.type === 'client' ? <Users className="w-5 h-5" /> :
                               rec.type === 'service' ? <TrendingUp className="w-5 h-5" /> :
                               <Lightbulb className="w-5 h-5" />}
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                {rec.title}
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                              </h5>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {rec.description}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-sm font-bold">Pro Tip</p>
                      </div>
                      <p className="text-xs text-indigo-100 leading-relaxed">
                        Regularly reviewing these insights helps you stay ahead of market trends and optimize your business operations for maximum profitability.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 space-y-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm">
              <AlertCircle className="w-10 h-10 text-slate-300" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-900">No Insights Yet</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Add some sales and expenses data to unlock AI-powered business analysis and strategic recommendations.
              </p>
            </div>
            <Button 
              onClick={handleGenerateInsights}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Try Generating Now
            </Button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
