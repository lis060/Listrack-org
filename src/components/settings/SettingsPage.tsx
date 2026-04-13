import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  Bell, 
  ShieldCheck, 
  Palette, 
  Database, 
  Save, 
  LogOut, 
  Trash2, 
  Download, 
  History,
  Mail,
  Phone,
  Globe,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  PiggyBank,
  Users,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { UserSettings } from '@/types';
import { signOut } from 'firebase/auth';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const defaultSettings: UserSettings = {
  fullName: '',
  email: '',
  phone: '',
  businessName: '',
  currency: 'USD',
  monthlySavingsTarget: 1000,
  businessCategories: ['Consulting', 'Design', 'Development', 'Marketing', 'Other'],
  defaultSalesCategory: 'Consulting',
  defaultExpenseCategory: 'Software',
  emailNotifications: true,
  taskReminders: true,
  savingsReminders: false,
  followUpReminders: true,
  theme: 'system',
  rowsPerPage: 10,
  dateFormat: 'YYYY-MM-DD',
  dashboardDefaultView: 'overview'
};

export function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSettings({ ...defaultSettings, ...docSnap.data() });
        } else {
          // Initialize with defaults if no settings exist
          setSettings({
            ...defaultSettings,
            fullName: user.displayName || '',
            email: user.email || ''
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      await setDoc(doc(db, 'settings', user.uid), settings);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      handleFirestoreError(error, OperationType.WRITE, 'settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (newCategory && !settings.businessCategories.includes(newCategory)) {
      setSettings(prev => ({
        ...prev,
        businessCategories: [...prev.businessCategories, newCategory]
      }));
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    setSettings(prev => ({
      ...prev,
      businessCategories: prev.businessCategories.filter(c => c !== cat)
    }));
  };

  const handleClearDemoData = async () => {
    if (!user || !confirm('Are you sure you want to clear all data? This cannot be undone.')) return;
    
    const collections = ['sales', 'expenses', 'tasks', 'savings', 'clients'];
    const batch = writeBatch(db);

    try {
      for (const colName of collections) {
        const querySnapshot = await getDocs(collection(db, colName));
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }
      await batch.commit();
      alert('All data has been cleared successfully.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'all_data');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile, preferences, and system options</p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === 'success' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-emerald-600 text-sm font-bold"
            >
              <CheckCircle2 className="w-4 h-4" />
              Changes saved!
            </motion.div>
          )}
          {saveStatus === 'error' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-rose-600 text-sm font-bold"
            >
              <AlertCircle className="w-4 h-4" />
              Failed to save
            </motion.div>
          )}
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 gap-2 px-6"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Navigation Sidebar (Mobile Scrollable) */}
        <div className="lg:col-span-1">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 no-scrollbar sticky top-20 lg:top-24 z-10 bg-slate-50/80 backdrop-blur-md lg:bg-transparent -mx-4 px-4 lg:mx-0 lg:px-0">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'business', label: 'Business', icon: Building2 },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'preferences', label: 'App Preferences', icon: Palette },
              { id: 'security', label: 'Security', icon: ShieldCheck },
              { id: 'data', label: 'Data Management', icon: Database },
            ].map((item) => (
              <a 
                key={item.id}
                href={`#${item.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs md:text-sm font-black text-slate-600 hover:bg-white lg:hover:bg-slate-100 hover:text-slate-900 transition-all group whitespace-nowrap border border-transparent hover:border-slate-200 shadow-sm lg:shadow-none bg-white lg:bg-transparent"
              >
                <item.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                {item.label}
              </a>
            ))}
            <div className="hidden lg:block">
              <Separator className="my-4" />
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 px-4 py-6 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-black"
                onClick={() => signOut(auth)}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Settings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card id="profile" className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden bg-white rounded-3xl">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-transparent py-6 md:py-8 px-6 md:px-8">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 md:p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Profile Settings</CardTitle>
                    <CardDescription className="text-xs md:text-sm text-slate-500 font-medium">Update your personal information and business identity</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-8 md:space-y-10">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center p-5 md:p-6 rounded-3xl bg-slate-50/50 border border-slate-100">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-3xl bg-white shadow-inner border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-300">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-10 h-10 text-slate-300" />
                      )}
                    </div>
                    <Button size="icon" variant="secondary" className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl shadow-xl border border-slate-200 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 bg-white">
                      <Palette className="w-4 h-4 text-indigo-600" />
                    </Button>
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="text-lg font-black text-slate-900 tracking-tight">{user?.displayName || 'User'}</h4>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="text-sm font-medium">{user?.email}</span>
                    </div>
                    <Badge variant="outline" className="mt-2 bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3 py-1">
                      <CheckCircle2 className="w-3 h-3 mr-1.5" />
                      Verified Account
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Name</Label>
                    <Input 
                      id="fullName" 
                      value={settings.fullName} 
                      onChange={(e) => setSettings(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter your full name"
                      className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all rounded-xl font-medium"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={settings.email} 
                      disabled
                      className="h-12 bg-slate-100/50 border-slate-200 text-slate-400 cursor-not-allowed rounded-xl font-medium"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={settings.phone} 
                      onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                      className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all rounded-xl font-medium"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="businessName" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Business Name</Label>
                    <Input 
                      id="businessName" 
                      value={settings.businessName} 
                      onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Your Company LLC"
                      className="h-12 bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all rounded-xl font-medium"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Business Settings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card id="business" className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden bg-white rounded-3xl">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 to-transparent py-6 md:py-8 px-6 md:px-8">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 md:p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Business Settings</CardTitle>
                    <CardDescription className="text-xs md:text-sm text-slate-500 font-medium">Configure your financial defaults and categories</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-8 md:space-y-10">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Default Currency</Label>
                    <Select 
                      value={settings.currency} 
                      onValueChange={(val) => setSettings(prev => ({ ...prev, currency: val }))}
                    >
                      <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/5 font-medium">
                        <SelectValue placeholder="Select Currency" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="GHS">GHS (₵)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Monthly Savings Target</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">$</span>
                      <Input 
                        type="number"
                        value={settings.monthlySavingsTarget} 
                        onChange={(e) => setSettings(prev => ({ ...prev, monthlySavingsTarget: Number(e.target.value) }))}
                        className="h-12 pl-10 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/5 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-6 rounded-3xl bg-slate-50/50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Business Categories</Label>
                    <Badge variant="secondary" className="bg-white text-slate-500 border-slate-200 font-bold">{settings.businessCategories.length} Total</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {settings.businessCategories.map(cat => (
                      <Badge key={cat} variant="secondary" className="pl-4 pr-1.5 py-1.5 gap-2 bg-white text-slate-700 border-slate-200 shadow-sm hover:border-emerald-200 transition-all rounded-lg font-bold">
                        {cat}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-5 h-5 hover:bg-rose-50 hover:text-rose-600 rounded-md transition-colors"
                          onClick={() => handleRemoveCategory(cat)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Input 
                      placeholder="Add new category..." 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      className="h-11 text-sm bg-white border-slate-200 rounded-xl shadow-sm focus:ring-4 focus:ring-emerald-500/5"
                    />
                    <Button 
                      variant="outline" 
                      className="h-11 px-6 rounded-xl border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 font-bold transition-all"
                      onClick={handleAddCategory}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notification Settings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card id="notifications" className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden bg-white rounded-3xl">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-amber-50/50 to-transparent py-6 md:py-8 px-6 md:px-8">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 md:p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-200">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Notification Settings</CardTitle>
                    <CardDescription className="text-xs md:text-sm text-slate-500 font-medium">Control how you receive alerts and updates</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-4">
                {[
                  { id: 'emailNotifications', label: 'Email Notifications', desc: 'Receive weekly performance summaries via email', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { id: 'taskReminders', label: 'Task Reminders', desc: 'Get notified about upcoming task deadlines', icon: CheckSquare, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { id: 'savingsReminders', label: 'Savings Reminders', desc: 'Monthly reminders to log your savings progress', icon: PiggyBank, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { id: 'followUpReminders', label: 'Client Follow-ups', desc: 'Alerts for scheduled client follow-up dates', icon: Users, color: 'text-violet-500', bg: 'bg-violet-50' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all group">
                    <div className="flex items-center gap-5">
                      <div className={cn("p-3 rounded-2xl shadow-sm border border-white transition-transform group-hover:scale-110", item.bg)}>
                        <item.icon className={cn("w-5 h-5", item.color)} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 tracking-tight">{item.label}</p>
                        <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={(settings as any)[item.id]} 
                      onCheckedChange={(val) => setSettings(prev => ({ ...prev, [item.id]: val }))}
                      className="data-[state=checked]:bg-amber-500"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* App Preferences */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card id="preferences" className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden bg-white rounded-3xl">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-violet-50/50 to-transparent py-6 md:py-8 px-6 md:px-8">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 md:p-3 bg-violet-600 rounded-2xl shadow-lg shadow-violet-200">
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg md:text-xl font-black text-slate-900 tracking-tight">App Preferences</CardTitle>
                    <CardDescription className="text-xs md:text-sm text-slate-500 font-medium">Customize your dashboard experience</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-8 md:space-y-10">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Theme Selection</Label>
                    <Select 
                      value={settings.theme} 
                      onValueChange={(val: any) => setSettings(prev => ({ ...prev, theme: val }))}
                    >
                      <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 rounded-xl font-medium">
                        <SelectValue placeholder="Select Theme" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
                        <SelectItem value="light">Light Mode</SelectItem>
                        <SelectItem value="dark">Dark Mode</SelectItem>
                        <SelectItem value="system">System Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Table Rows Per Page</Label>
                    <Select 
                      value={String(settings.rowsPerPage)} 
                      onValueChange={(val) => setSettings(prev => ({ ...prev, rowsPerPage: Number(val) }))}
                    >
                      <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 rounded-xl font-medium">
                        <SelectValue placeholder="Select Rows" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
                        <SelectItem value="5">5 Rows</SelectItem>
                        <SelectItem value="10">10 Rows</SelectItem>
                        <SelectItem value="25">25 Rows</SelectItem>
                        <SelectItem value="50">50 Rows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Date Format</Label>
                    <Select 
                      value={settings.dateFormat} 
                      onValueChange={(val) => setSettings(prev => ({ ...prev, dateFormat: val }))}
                    >
                      <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 rounded-xl font-medium">
                        <SelectValue placeholder="Select Format" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Default Dashboard View</Label>
                    <Select 
                      value={settings.dashboardDefaultView} 
                      onValueChange={(val) => setSettings(prev => ({ ...prev, dashboardDefaultView: val }))}
                    >
                      <SelectTrigger className="h-12 bg-slate-50/50 border-slate-200 rounded-xl font-medium">
                        <SelectValue placeholder="Select View" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
                        <SelectItem value="overview">Overview</SelectItem>
                        <SelectItem value="sales">Sales Focus</SelectItem>
                        <SelectItem value="tasks">Task Focus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Settings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card id="security" className="border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden bg-white rounded-3xl">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-transparent py-6 md:py-8 px-6 md:px-8">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 md:p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Security Settings</CardTitle>
                    <CardDescription className="text-xs md:text-sm text-slate-500 font-medium">Manage your account security and protection</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-8">
                <div className="p-6 md:p-8 rounded-3xl bg-blue-50/30 border border-blue-100 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <div className="flex items-center justify-between relative">
                    <div className="space-y-1">
                      <p className="text-md font-black text-slate-900 tracking-tight">Account Protection</p>
                      <p className="text-xs text-slate-500 font-medium">Your account is currently protected by Google Authentication</p>
                    </div>
                    <Badge className="bg-blue-600 text-white border-none px-4 py-1 font-black uppercase tracking-widest text-[10px]">Active</Badge>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-blue-50 shadow-sm relative">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Signed in as</span>
                      <span className="text-sm font-bold text-slate-900">{user?.email}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-between h-14 px-8 font-black text-slate-700 border-slate-200 hover:bg-slate-50 rounded-2xl transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                        <Lock className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                      </div>
                      Change Password
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
                  </Button>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium italic">
                    <AlertCircle className="w-3 h-3" />
                    Password management is handled via your Google Account settings
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Data Management */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card id="data" className="border-rose-200 shadow-2xl shadow-rose-100/50 overflow-hidden bg-white rounded-3xl">
              <CardHeader className="border-b border-rose-100 bg-gradient-to-r from-rose-50 to-transparent py-6 md:py-8 px-6 md:px-8">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 md:p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-200">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg md:text-xl font-black text-rose-900 tracking-tight">Data Management</CardTitle>
                    <CardDescription className="text-xs md:text-sm text-rose-600/70 font-medium">Handle your business data, backups, and account status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-8 md:space-y-10">
                <div className="grid gap-6 md:gap-8 md:grid-cols-2">
                  <div className="p-6 md:p-8 rounded-3xl bg-slate-50/50 border border-slate-100 space-y-5 hover:bg-white hover:shadow-xl hover:border-slate-200 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                        <Download className="w-5 h-5 text-indigo-600" />
                      </div>
                      <p className="text-sm font-black text-slate-900 tracking-tight">Export Data</p>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Download all your sales, expenses, and client data in a single CSV file for external use.</p>
                    <Button variant="outline" className="w-full h-11 text-xs font-black border-slate-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all uppercase tracking-widest">Export as CSV</Button>
                  </div>
                  <div className="p-8 rounded-3xl bg-slate-50/50 border border-slate-100 space-y-5 hover:bg-white hover:shadow-xl hover:border-slate-200 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                        <History className="w-5 h-5 text-emerald-600" />
                      </div>
                      <p className="text-sm font-black text-slate-900 tracking-tight">Backup Data</p>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Create a secure snapshot of your entire business database to restore in case of accidental loss.</p>
                    <Button variant="outline" className="w-full h-11 text-xs font-black border-slate-200 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all uppercase tracking-widest">Create Backup</Button>
                  </div>
                </div>

                <div className="p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] bg-rose-50/50 border-2 border-rose-100 space-y-6 md:space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-rose-100/30 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                  <div className="flex items-center gap-4 relative">
                    <div className="p-2.5 md:p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-200">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-md md:text-lg font-black text-rose-900 uppercase tracking-widest">Danger Zone</p>
                      <p className="text-[10px] md:text-xs text-rose-600/70 font-medium">Irreversible actions that affect your entire account</p>
                    </div>
                  </div>
                  <div className="space-y-4 md:space-y-6 relative">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 p-5 md:p-6 rounded-3xl bg-white/50 border border-rose-100 shadow-sm">
                      <div>
                        <p className="text-sm md:text-md font-black text-rose-900 tracking-tight">Clear All Business Data</p>
                        <p className="text-[10px] md:text-xs text-rose-600/70 font-medium mt-1">This will permanently delete all sales, expenses, tasks, and clients.</p>
                      </div>
                      <Button 
                        variant="destructive" 
                        className="bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-500/20 h-11 md:h-12 px-6 md:px-8 font-black rounded-xl transition-all hover:scale-105 active:scale-95 text-xs md:text-sm"
                        onClick={handleClearDemoData}
                      >
                        Clear All Data
                      </Button>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 p-5 md:p-6 rounded-3xl bg-white/50 border border-rose-100 shadow-sm">
                      <div>
                        <p className="text-sm md:text-md font-black text-rose-900 tracking-tight">Delete Account</p>
                        <p className="text-[10px] md:text-xs text-rose-600/70 font-medium mt-1">Permanently remove your account and all associated data.</p>
                      </div>
                      <Button variant="ghost" className="text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-black h-11 md:h-12 px-6 md:px-8 rounded-xl transition-all text-xs md:text-sm">Delete Account</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
