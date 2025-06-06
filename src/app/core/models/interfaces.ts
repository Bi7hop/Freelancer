export interface Project {
  id: string;
  name: string;
  client: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  progress: number;
  hours: number;
  budget: number;
  hourlyRate: number;
  deadline: Date;
  createdAt: Date;
  description?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  projects: string[];
  totalRevenue: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Invoice {
  id: string;
  clientId: string;
  projectId?: string;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number; 
  hourlyRate: number;
  date: Date;
}