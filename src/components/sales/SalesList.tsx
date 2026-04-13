import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  MoreHorizontal,
  Calendar as CalendarIcon,
  Trash2,
  Edit2
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
import { Sale } from '@/types';
import { cn } from '@/lib/utils';
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

export function SalesList() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    serviceName: '',
    customerName: '',
    amount: '',
    paymentStatus: 'pending' as Sale['paymentStatus'],
    note: ''
  });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'sales'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sale[];
      setSales(salesData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'sales');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const saleData = {
        date: formData.date,
        category: formData.category,
        serviceName: formData.serviceName,
        customerName: formData.customerName,
        amount: parseFloat(formData.amount) || 0,
        paymentStatus: formData.paymentStatus,
        note: formData.note,
        updatedAt: serverTimestamp(),
        userId: user.uid
      };
      
      if (editingId) {
        await updateDoc(doc(db, 'sales', editingId), saleData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'sales'), {
          ...saleData,
          createdAt: serverTimestamp()
        });
      }
      
      // Reset form except date
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: '',
        serviceName: '',
        customerName: '',
        amount: '',
        paymentStatus: 'pending',
        note: ''
      });
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.WRITE, 'sales');
    }
  };

  const startEdit = (sale: Sale) => {
    setEditingId(sale.id);
    setFormData({
      date: sale.date,
      category: sale.category,
      serviceName: sale.serviceName,
      customerName: sale.customerName,
      amount: sale.amount.toString(),
      paymentStatus: sale.paymentStatus,
      note: sale.note || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      serviceName: '',
      customerName: '',
      amount: '',
      paymentStatus: 'pending',
      note: ''
    });
  };

  const exportToCSV = () => {
    if (sales.length === 0) return;
    
    const headers = ['Date', 'Customer', 'Service', 'Category', 'Amount', 'Status', 'Note'];
    const rows = sales.map(s => [
      s.date,
      s.customerName,
      s.serviceName,
      s.category,
      s.amount,
      s.paymentStatus,
      s.note || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteSale = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'sales', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sales/${id}`);
    }
  };

  const filteredSales = sales.filter(sale => 
    sale.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground">Record and manage your business sales revenue.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={exportToCSV} disabled={sales.length === 0}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Add Sale Form */}
        <Card className="lg:col-span-1 h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Sale' : 'Add New Sale'}</CardTitle>
            <CardDescription>
              {editingId ? 'Update the details of this transaction.' : 'Enter the details of the new transaction.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  name="date" 
                  type="date" 
                  required 
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input 
                  id="customerName" 
                  name="customerName" 
                  placeholder="e.g. John Doe" 
                  required 
                  value={formData.customerName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => handleSelectChange('category', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input 
                    id="amount" 
                    name="amount" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    required 
                    value={formData.amount}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceName">Service Name</Label>
                <Input 
                  id="serviceName" 
                  name="serviceName" 
                  placeholder="e.g. Web Design" 
                  required 
                  value={formData.serviceName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select 
                  value={formData.paymentStatus} 
                  onValueChange={(v) => handleSelectChange('paymentStatus', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Textarea 
                  id="note" 
                  name="note" 
                  placeholder="Additional details..." 
                  className="resize-none"
                  value={formData.note}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex gap-2">
                {editingId && (
                  <Button type="button" variant="outline" className="flex-1" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" className={cn("gap-2", editingId ? "flex-1" : "w-full")}>
                  {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingId ? 'Update Sale' : 'Record Sale'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>A list of your recorded transactions.</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold px-4 md:px-6">Date</TableHead>
                    <TableHead className="font-semibold">Details</TableHead>
                    <TableHead className="text-right font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell">Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Loading sales...
                      </TableCell>
                    </TableRow>
                  ) : filteredSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No sales found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSales.map((sale) => (
                      <TableRow key={sale.id} className="group">
                        <TableCell className="whitespace-nowrap px-4 md:px-6">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs md:text-sm">{sale.date}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm md:text-base">{sale.customerName}</span>
                            <span className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">
                              {sale.serviceName} • {sale.category}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm md:text-base">
                          ${sale.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge 
                            variant="outline"
                            className={cn(
                              "capitalize",
                              sale.paymentStatus === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              sale.paymentStatus === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-rose-50 text-rose-700 border-rose-200"
                            )}
                          >
                            {sale.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            } />
                            <DropdownMenuContent align="end">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem className="gap-2" onClick={() => startEdit(sale)}>
                                  <Edit2 className="w-3.5 h-3.5" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive gap-2"
                                  onClick={() => deleteSale(sale.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
