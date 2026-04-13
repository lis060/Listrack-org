import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  MoreHorizontal,
  Calendar as CalendarIcon,
  Trash2,
  Edit2,
  Loader2,
  Receipt,
  Tag,
  DollarSign,
  FileText,
  Filter
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
import { Expense } from '@/types';
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

export function ExpensesList() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    category: '',
    amount: '',
    note: ''
  });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
      setExpenses(expensesData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'expenses');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const expenseData = {
        date: formData.date,
        name: formData.name,
        category: formData.category,
        amount: parseFloat(formData.amount) || 0,
        note: formData.note,
        updatedAt: serverTimestamp(),
        userId: user.uid
      };
      
      if (editingId) {
        await updateDoc(doc(db, 'expenses', editingId), expenseData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'expenses'), {
          ...expenseData,
          createdAt: serverTimestamp()
        });
      }
      
      // Reset form except date
      setFormData({
        date: new Date().toISOString().split('T')[0],
        name: '',
        category: '',
        amount: '',
        note: ''
      });
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.WRITE, 'expenses');
    }
  };

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setFormData({
      date: expense.date,
      name: expense.name,
      category: expense.category,
      amount: expense.amount.toString(),
      note: expense.note || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      name: '',
      category: '',
      amount: '',
      note: ''
    });
  };

  const exportToCSV = () => {
    if (expenses.length === 0) return;
    
    const headers = ['Date', 'Name', 'Category', 'Amount', 'Note'];
    const rows = expenses.map(e => [
      e.date,
      e.name,
      e.category,
      e.amount,
      e.note || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `expenses/${id}`);
    }
  };

  const filteredExpenses = expenses.filter(expense => 
    expense.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (expense.note?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Expenses</h1>
          <p className="text-muted-foreground mt-2 text-lg">Track all business spending in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="px-4 py-2 bg-rose-50 border-rose-100 hidden sm:flex items-center gap-3">
            <div className="p-2 bg-rose-500 rounded-full">
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-rose-600">Total Spent</p>
              <p className="text-xl font-black text-rose-700">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </Card>
          <Button variant="outline" className="gap-2 h-11 px-5 font-semibold border-2 hover:bg-muted transition-all" onClick={exportToCSV} disabled={expenses.length === 0}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Add Expense Form */}
        <Card className="lg:col-span-4 h-fit lg:sticky lg:top-24 border-2 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-rose-500 w-full" />
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{editingId ? 'Edit Expense' : 'Add New Expense'}</CardTitle>
            <CardDescription>{editingId ? 'Update the details of this business expense.' : 'Record a new business expense.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="date" 
                    name="date" 
                    type="date" 
                    required 
                    className="pl-10 h-11 border-2 focus-visible:ring-rose-500"
                    value={formData.date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expense Name</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="e.g. Office Supplies" 
                    required 
                    className="pl-10 h-11 border-2 focus-visible:ring-rose-500"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger className="h-11 border-2 focus:ring-rose-500">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Supplies">Supplies</SelectItem>
                      <SelectItem value="Rent">Rent</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Travel">Travel</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="amount" 
                      name="amount" 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      required 
                      className="pl-10 h-11 border-2 focus-visible:ring-rose-500"
                      value={formData.amount}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Note (Optional)</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Textarea 
                    id="note" 
                    name="note" 
                    placeholder="Additional details..." 
                    className="pl-10 resize-none min-h-[100px] border-2 focus-visible:ring-rose-500"
                    value={formData.note}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {editingId && (
                  <Button type="button" variant="outline" className="flex-1 h-12 font-bold" onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" className={cn("h-12 gap-2 text-lg font-bold bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-[0.98]", editingId ? "flex-1" : "w-full")}>
                  {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {editingId ? 'Update Expense' : 'Add Expense'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card className="lg:col-span-8 border-2 shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-muted/30 pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Expense History</CardTitle>
                <CardDescription>A list of all your recorded business expenses.</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search expenses..." 
                    className="pl-10 h-10 border-2 bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10 border-2">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground h-12 px-4 md:px-6">Date</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground h-12 px-4 md:px-6">Expense Name</TableHead>
                    <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground h-12 px-6 hidden sm:table-cell">Category</TableHead>
                    <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest text-muted-foreground h-12 px-4 md:px-6">Amount</TableHead>
                    <TableHead className="w-[80px] px-4 md:px-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-b">
                        <TableCell colSpan={5} className="py-6 px-4 md:px-6">
                          <div className="flex items-center gap-4 animate-pulse">
                            <div className="h-4 w-24 bg-muted rounded" />
                            <div className="h-4 flex-1 bg-muted rounded" />
                            <div className="h-4 w-20 bg-muted rounded hidden sm:block" />
                            <div className="h-4 w-24 bg-muted rounded ml-auto" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-[400px] text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground animate-in zoom-in duration-300">
                          <div className="p-6 bg-muted rounded-full mb-6">
                            <Receipt className="w-16 h-16 opacity-20" />
                          </div>
                          <p className="text-2xl font-bold text-foreground">No expenses found</p>
                          <p className="text-muted-foreground mt-2 max-w-[250px]">Start by adding a new expense using the form on the left.</p>
                          <Button 
                            variant="outline" 
                            className="mt-8 border-2"
                            onClick={() => setSearchQuery('')}
                          >
                            Clear Search
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id} className="group hover:bg-rose-50/30 transition-colors border-b last:border-0">
                        <TableCell className="px-4 md:px-6 py-4">
                          <div className="flex items-center gap-2 font-mono text-[10px] md:text-sm text-muted-foreground">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            {expense.date}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 md:px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-sm md:text-base">{expense.name}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5 sm:hidden">{expense.category}</span>
                            {expense.note && (
                              <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 italic">
                                {expense.note}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 hidden sm:table-cell">
                          <Badge variant="outline" className="font-bold uppercase text-[10px] tracking-wider px-2 py-0.5 border-2">
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-4 md:px-6 py-4">
                          <span className="font-mono font-black text-rose-600 text-base md:text-lg">
                            -${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 md:px-6 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button variant="ghost" size="icon" className="h-9 w-9 md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100 hover:text-rose-600">
                                <MoreHorizontal className="w-5 h-5" />
                              </Button>
                            } />
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Actions</DropdownMenuLabel>
                                <DropdownMenuItem className="gap-2 focus:bg-rose-50 focus:text-rose-600 py-2.5" onClick={() => startEdit(expense)}>
                                  <Edit2 className="w-4 h-4" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-rose-600 gap-2 focus:bg-rose-600 focus:text-white py-2.5"
                                  onClick={() => deleteExpense(expense.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Record
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
            {filteredExpenses.length > 0 && (
              <div className="p-6 border-t bg-muted/10 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Showing {filteredExpenses.length} of {expenses.length} records
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled className="border-2 font-bold">Previous</Button>
                  <Button variant="outline" size="sm" disabled className="border-2 font-bold">Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
