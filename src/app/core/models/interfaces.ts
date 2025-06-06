// Basis-Interfaces für unsere Freelancer-App

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
  address: Address;
  projects: string[]; // Project IDs
  totalRevenue: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  // Geschäftsdaten für Rechnungen
  companyType?: 'individual' | 'company';
  vatId?: string; // Umsatzsteuer-ID
  taxNumber?: string; // Steuernummer
}

export interface Address {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface CompanySettings {
  // Eigene Firmendaten
  companyName: string;
  ownerName: string;
  address: Address;
  email: string;
  phone: string;
  website?: string;
  
  // Steuerliche Daten
  vatId?: string; // Umsatzsteuer-ID (z.B. DE123456789)
  taxNumber?: string; // Steuernummer
  isSmallBusiness: boolean; // Kleinunternehmer nach §19 UStG
  
  // Banking
  bankName: string;
  iban: string;
  bic: string;
  
  // Rechnungseinstellungen
  invoicePrefix: string; // z.B. "INV"
  nextInvoiceNumber: number;
  defaultPaymentTerms: number; // Tage
  defaultTaxRate: number; // Standard-MwSt (19%)
}

export interface Invoice {
  id: string;
  clientId: string;
  projectId?: string;
  
  // Rechnungsnummern
  invoiceNumber: string; // z.B. INV-2024-001
  invoiceDate: Date;
  deliveryDate: Date; // Leistungsdatum
  dueDate: Date;
  
  // Status
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  
  // Positionen
  items: InvoiceItem[];
  
  // Beträge
  subtotal: number; // Netto-Summe
  taxRate: number; // MwSt-Satz (0, 7, 19)
  taxAmount: number; // MwSt-Betrag
  total: number; // Brutto-Summe
  
  // Zahlungsinfo
  paymentTerms: number; // Zahlungsziel in Tagen
  paymentMethod?: 'bank_transfer' | 'paypal' | 'cash';
  paidDate?: Date;
  paidAmount?: number;
  
  // Zusätzliche Infos
  notes?: string; // Besondere Hinweise
  internalNotes?: string; // Interne Notizen
  
  // Metadaten
  createdAt: Date;
  updatedAt: Date;
  
  // PDF-Info
  pdfGenerated?: boolean;
  pdfPath?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string; // 'Stunden', 'Stück', 'Pauschal'
  unitPrice: number; // Einzelpreis netto
  discount?: number; // Rabatt in %
  taxRate: number; // MwSt-Satz für diese Position
  netAmount: number; // Netto-Betrag
  taxAmount: number; // MwSt-Betrag
  grossAmount: number; // Brutto-Betrag
}

export interface TimeEntry {
  id: string;
  projectId: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  hourlyRate: number;
  date: Date;
  invoiceId?: string; // Zugeordnet zu Rechnung
  invoiced: boolean; // Bereits abgerechnet
}

// Deutsche Rechtstexte und Vorlagen
export interface InvoiceTemplate {
  id: string;
  name: string;
  
  // Texte
  headerText?: string;
  footerText: string;
  paymentInstructions: string;
  smallBusinessNote?: string; // §19 UStG Hinweis
  reverseChargeNote?: string; // Reverse Charge bei EU
  
  // Design
  logoPath?: string;
  primaryColor: string;
  fontFamily: string;
}