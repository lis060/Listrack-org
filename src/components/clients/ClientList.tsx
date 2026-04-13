import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Users, 
  UserCheck, 
  UserPlus, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Briefcase, 
  MoreHorizontal,
  Trash2,
  Edit2,
  Eye,
  Filter,
  MessageSquare,
  Building2,
  Calendar
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Client } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

const statuses = ['Lead', 'Active', 'Completed', 'Follow-up'] as const;

export function ClientList() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    phone: '',
    email: '',
    service: '',
    status: 'Lead' as Client['status'],
    note: '',
    followUpDate: ''
  });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Client[];
      setClients(clientsData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'clients');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value as Client['status'] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const clientData = {
        ...formData,
        updatedAt: serverTimestamp(),
        userId: user.uid
      };
      
      if (editingId) {
        await updateDoc(doc(db, 'clients', editingId), clientData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'clients'), {
          ...clientData,
          createdAt: serverTimestamp()
        });
      }
      
      setFormData({
        name: '',
        businessName: '',
        phone: '',
        email: '',
        service: '',
        status: 'Lead',
        note: '',
        followUpDate: ''
      });
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.WRITE, 'clients');
    }
  };

  const startEdit = (client: Client) => {
    setEditingId(client.id);
    setFormData({
      name: client.name,
      businessName: client.businessName,
      phone: client.phone,
      email: client.email,
      service: client.service,
      status: client.status,
      note: client.note || '',
      followUpDate: client.followUpDate || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      businessName: '',
      phone: '',
      email: '',
      service: '',
      status: 'Lead',
      note: ''
    });
  };

  const deleteClient = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clients/${id}`);
    }
  };

  const updateClientStatus = async (id: string, newStatus: Client['status']) => {
    if (!user) return;
    try {
      const clientRef = doc(db, 'clients', id);
      await updateDoc(clientRef, { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${id}`);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'Active').length,
    leads: clients.filter(c => c.status === 'Lead').length,
    completed: clients.filter(c => c.status === 'Completed').length,
  };

  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Lead': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'Follow-up': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage all client information in one place</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 bg-indigo-50 text-indigo-700 border-indigo-200 font-medium">
            {clients.length} Total Clients
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative group">
            <div className="absolute right-[-10%] top-[-10%] opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Users size={120} />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-100">Total Clients</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold tracking-tight">{stats.total}</div>
              <div className="flex items-center gap-1 mt-2 text-indigo-100 text-[10px] font-medium uppercase tracking-wider">
                <Users className="w-3 h-3" />
                Customer base
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-none shadow-sm bg-emerald-600 text-white overflow-hidden relative group">
            <div className="absolute right-[-10%] top-[-10%] opacity-10 group-hover:scale-110 transition-transform duration-500">
              <UserCheck size={120} />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-100">Active Clients</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold tracking-tight">{stats.active}</div>
              <div className="flex items-center gap-1 mt-2 text-emerald-100 text-[10px] font-medium uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3" />
                Currently working
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden relative group">
            <div className="absolute right-[-10%] top-[-10%] opacity-10 group-hover:scale-110 transition-transform duration-500">
              <UserPlus size={120} />
            </div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-100">Leads</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold tracking-tight">{stats.leads}</div>
              <div className="flex items-center gap-1 mt-2 text-blue-100 text-[10px] font-medium uppercase tracking-wider">
                <Plus className="w-3 h-3" />
                Potential clients
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden relative group">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-slate-900">{stats.completed}</div>
              <div className="flex items-center gap-1 mt-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3" />
                Projects delivered
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Add Client Form */}
        <Card className="lg:col-span-1 h-fit lg:sticky lg:top-24 border-slate-200 shadow-lg overflow-hidden">
          <div className="h-1.5 bg-indigo-600 w-full" />
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">{editingId ? 'Edit Client' : 'Add New Client'}</CardTitle>
            <CardDescription>{editingId ? 'Update details for this client.' : 'Enter client details to start tracking.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Client Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="John Doe" 
                  required 
                  className="h-11 border-slate-200 bg-slate-50/50 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Business Name</Label>
                <div className="relative group">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input 
                    id="businessName" 
                    name="businessName" 
                    placeholder="Acme Corp" 
                    required 
                    className="pl-10 h-11 border-slate-200 bg-slate-50/50 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all"
                    value={formData.businessName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Phone</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    placeholder="+1..." 
                    className="h-11 border-slate-200 bg-slate-50/50 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    required 
                    className="h-11 border-slate-200 bg-slate-50/50 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Service Interested In</Label>
                <div className="relative group">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input 
                    id="service" 
                    name="service" 
                    placeholder="e.g. Web Development" 
                    required 
                    className="pl-10 h-11 border-slate-200 bg-slate-50/50 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all"
                    value={formData.service}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Status</Label>
                <Select value={formData.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-11 border-slate-200 bg-slate-50/50 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="followUpDate" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Follow-up Date</Label>
                <div className="relative group">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input 
                    id="followUpDate" 
                    name="followUpDate" 
                    type="date" 
                    className="pl-10 h-11 border-slate-200 bg-slate-50/50 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all"
                    value={formData.followUpDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Note (Optional)</Label>
                <Textarea 
                  id="note" 
                  name="note" 
                  placeholder="Any additional details..." 
                  className="resize-none border-slate-200 bg-slate-50/50 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 min-h-[80px] transition-all"
                  value={formData.note}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex gap-2">
                {editingId && (
                  <Button type="button" variant="outline" className="flex-1 h-12 font-bold" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" className={cn("h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] gap-2", editingId ? "flex-1" : "w-full")}>
                  {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {editingId ? 'Update Client' : 'Add Client'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card className="lg:col-span-2 border-slate-200 shadow-lg overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Client Directory</CardTitle>
                <CardDescription className="text-slate-500">Manage and follow up with your customers.</CardDescription>
              </div>
              <div className="relative w-full md:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <Input 
                  placeholder="Search clients..." 
                  className="pl-10 h-11 border-slate-200 bg-white focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 border-b border-slate-100 hover:bg-slate-50/50">
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-14 px-4 md:px-6">Client & Business</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-14 hidden sm:table-cell">Contact Info</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-14">Service</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-14">Status</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5} className="p-4 md:p-8">
                          <div className="flex items-center gap-4 animate-pulse">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-full" />
                            <div className="space-y-3 flex-1">
                              <div className="h-4 bg-slate-100 rounded w-1/4" />
                              <div className="h-3 bg-slate-50 rounded w-1/2" />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-[450px] text-center">
                        <div className="flex flex-col items-center justify-center space-y-5 max-w-[300px] mx-auto">
                          <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                            <Users className="w-10 h-10 text-slate-300" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-bold text-slate-900 text-lg">No clients found</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">Start building your client list by adding your first entry.</p>
                          </div>
                          {searchQuery && (
                            <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="rounded-full px-6">
                              Clear Search
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {filteredClients.map((client) => (
                        <motion.tr 
                          key={client.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="group border-b border-slate-50 hover:bg-indigo-50/40 transition-all duration-200"
                        >
                          <TableCell className="py-4 md:py-5 px-4 md:px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs md:text-sm shrink-0">
                                {client.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-slate-900 text-sm md:text-base truncate">{client.name}</span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium truncate">
                                  <Building2 className="w-3 h-3" />
                                  {client.businessName}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 md:py-5 hidden sm:table-cell">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                {client.email}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {client.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 md:py-5">
                            <div className="flex flex-col">
                              <span className="text-xs md:text-sm font-semibold text-slate-700">{client.service}</span>
                              <span className="text-[10px] text-slate-400 sm:hidden">{client.email}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 md:py-5">
                            <Badge className={cn("px-1.5 md:px-2.5 py-0.5 text-[8px] md:text-[10px] font-bold uppercase tracking-widest border", getStatusColor(client.status))}>
                              {client.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 md:py-5 pr-4 md:pr-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <Button variant="ghost" size="icon" className="h-9 w-9 md:opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200">
                                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                </Button>
                              } />
                              <DropdownMenuContent align="end" className="w-52 p-1.5">
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 py-2">Client Actions</DropdownMenuLabel>
                                  <DropdownMenuItem className="gap-2.5 focus:bg-indigo-50 focus:text-indigo-600 py-3 rounded-md cursor-pointer" onClick={() => setSelectedClient(client)}>
                                    <Eye className="w-4 h-4" />
                                    <span className="font-medium">View Profile</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2.5 focus:bg-indigo-50 focus:text-indigo-600 py-3 rounded-md cursor-pointer" onClick={() => startEdit(client)}>
                                    <Edit2 className="w-4 h-4" />
                                    <span className="font-medium">Edit Details</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-1.5" />
                                  <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 py-1">Update Status</DropdownMenuLabel>
                                  {statuses.map(s => (
                                    <DropdownMenuItem 
                                      key={s} 
                                      className="gap-2.5 py-2 rounded-md cursor-pointer"
                                      onClick={() => updateClientStatus(client.id, s)}
                                    >
                                      <div className={cn("w-2 h-2 rounded-full", getStatusColor(s).split(' ')[0])} />
                                      <span className="text-xs">{s}</span>
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator className="my-1.5" />
                                  <DropdownMenuItem 
                                    className="text-rose-600 gap-2.5 focus:bg-rose-600 focus:text-white py-3 rounded-md cursor-pointer"
                                    onClick={() => deleteClient(client.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="font-medium">Delete Client</span>
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </TableBody>
              </Table>
            </div>
            {!isLoading && filteredClients.length > 0 && (
              <div className="p-5 border-t border-slate-100 bg-slate-50/20 flex items-center justify-between text-xs text-slate-500 font-medium">
                <p>Showing {filteredClients.length} clients in directory</p>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                    <Filter className="w-3 h-3 mr-1.5" />
                    Advanced Filter
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                    <Calendar className="w-3 h-3 mr-1.5" />
                    Schedule Follow-up
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
          {selectedClient && (
            <div className="flex flex-col">
              <div className="h-32 bg-indigo-600 relative">
                <div className="absolute -bottom-12 left-8 w-24 h-24 rounded-2xl bg-white p-1 shadow-xl">
                  <div className="w-full h-full rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-3xl">
                    {selectedClient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
              </div>
              <div className="pt-16 pb-8 px-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedClient.name}</h2>
                  <p className="text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                    <Building2 className="w-4 h-4" />
                    {selectedClient.businessName}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-indigo-500" />
                      {selectedClient.email}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phone Number</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-indigo-500" />
                      {selectedClient.phone || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Service</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                      {selectedClient.service}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Follow-up Date</p>
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      {selectedClient.followUpDate || 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</p>
                    <Badge className={cn("px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border", getStatusColor(selectedClient.status))}>
                      {selectedClient.status}
                    </Badge>
                  </div>
                </div>

                {selectedClient.note && (
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notes</p>
                    <div className="p-4 rounded-xl bg-slate-50 text-sm text-slate-600 leading-relaxed italic">
                      "{selectedClient.note}"
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={() => {
                    startEdit(selectedClient);
                    setSelectedClient(null);
                  }}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" className="flex-1 font-bold" onClick={() => setSelectedClient(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
