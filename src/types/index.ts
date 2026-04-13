export type Page = 'dashboard' | 'sales' | 'expenses' | 'tasks' | 'savings' | 'clients' | 'reports' | 'settings' | 'insights';

export interface Sale {
  id: string;
  date: string;
  category: string;
  serviceName: string;
  customerName: string;
  amount: number;
  paymentStatus: 'pending' | 'completed' | 'cancelled';
  note?: string;
}

export interface Expense {
  id: string;
  date: string;
  name: string;
  category: string;
  amount: number;
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface SavingsEntry {
  id: string;
  month: string;
  targetAmount: number;
  savedAmount: number;
  note?: string;
}

export interface Client {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  email: string;
  service: string;
  status: 'Lead' | 'Active' | 'Completed' | 'Follow-up';
  note?: string;
  followUpDate?: string;
}

export interface UserSettings {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  currency: string;
  monthlySavingsTarget: number;
  businessCategories: string[];
  defaultSalesCategory: string;
  defaultExpenseCategory: string;
  emailNotifications: boolean;
  taskReminders: boolean;
  savingsReminders: boolean;
  followUpReminders: boolean;
  theme: 'light' | 'dark' | 'system';
  rowsPerPage: number;
  dateFormat: string;
  dashboardDefaultView: string;
}
