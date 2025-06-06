import { Injectable, signal, computed } from '@angular/core';
import { Invoice, InvoiceItem, CompanySettings, Client } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  // State
  private invoices = signal<Invoice[]>([]);
  private companySettings = signal<CompanySettings | null>(null);

  // Computed Signals
  readonly allInvoices = computed(() => this.invoices());
  readonly draftInvoices = computed(() => this.invoices().filter(inv => inv.status === 'draft'));
  readonly sentInvoices = computed(() => this.invoices().filter(inv => inv.status === 'sent'));
  readonly paidInvoices = computed(() => this.invoices().filter(inv => inv.status === 'paid'));
  readonly overdueInvoices = computed(() => this.invoices().filter(inv => inv.status === 'overdue'));

  // Statistiken
  readonly totalRevenue = computed(() => 
    this.paidInvoices().reduce((sum, inv) => sum + inv.total, 0)
  );
  
  readonly outstandingAmount = computed(() => 
    this.sentInvoices().reduce((sum, inv) => sum + inv.total, 0)
  );
  
  readonly overdueAmount = computed(() => 
    this.overdueInvoices().reduce((sum, inv) => sum + inv.total, 0)
  );

  constructor() {
    this.loadInvoices();
    this.loadCompanySettings();
  }

  // Rechnungen laden (später von API)
  private loadInvoices(): void {
    const mockInvoices: Invoice[] = [
      {
        id: '1',
        clientId: '1',
        projectId: '1',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: new Date('2024-06-01'),
        deliveryDate: new Date('2024-05-31'),
        dueDate: new Date('2024-06-15'),
        status: 'paid',
        items: [
          {
            id: '1',
            description: 'Website Entwicklung',
            quantity: 60,
            unit: 'Stunden',
            unitPrice: 75,
            taxRate: 19,
            netAmount: 4500,
            taxAmount: 855,
            grossAmount: 5355
          }
        ],
        subtotal: 4500,
        taxRate: 19,
        taxAmount: 855,
        total: 5355,
        paymentTerms: 14,
        paidDate: new Date('2024-06-10'),
        paidAmount: 5355,
        createdAt: new Date('2024-06-01'),
        updatedAt: new Date('2024-06-10')
      }
    ];
    
    this.invoices.set(mockInvoices);
  }

  // Firmeneinstellungen laden
  private loadCompanySettings(): void {
    const defaultSettings: CompanySettings = {
      companyName: 'Max Mustermann Webentwicklung',
      ownerName: 'Max Mustermann',
      address: {
        street: 'Musterstraße',
        houseNumber: '123',
        postalCode: '12345',
        city: 'Berlin',
        country: 'Deutschland'
      },
      email: 'kontakt@max-mustermann.de',
      phone: '+49 30 12345678',
      website: 'www.max-mustermann.de',
      
      // Steuerlich
      vatId: 'DE123456789',
      taxNumber: '12/345/67890',
      isSmallBusiness: false,
      
      // Banking
      bankName: 'Deutsche Bank',
      iban: 'DE89 1234 5678 9012 3456 78',
      bic: 'DEUTDEDB123',
      
      // Rechnungen
      invoicePrefix: 'INV',
      nextInvoiceNumber: 2,
      defaultPaymentTerms: 14,
      defaultTaxRate: 19
    };
    
    this.companySettings.set(defaultSettings);
  }

  // Neue Rechnung erstellen
  createInvoice(clientId: string, projectId?: string): Invoice {
    const settings = this.companySettings();
    if (!settings) throw new Error('Firmeneinstellungen nicht gefunden');

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + settings.defaultPaymentTerms);

    const invoice: Invoice = {
      id: Date.now().toString(),
      clientId,
      projectId,
      invoiceNumber: this.generateInvoiceNumber(),
      invoiceDate: now,
      deliveryDate: now,
      dueDate,
      status: 'draft',
      items: [],
      subtotal: 0,
      taxRate: settings.defaultTaxRate,
      taxAmount: 0,
      total: 0,
      paymentTerms: settings.defaultPaymentTerms,
      createdAt: now,
      updatedAt: now
    };

    this.invoices.update(invoices => [...invoices, invoice]);
    this.updateNextInvoiceNumber();
    
    return invoice;
  }

  // Rechnungsnummer generieren
  private generateInvoiceNumber(): string {
    const settings = this.companySettings();
    if (!settings) return 'INV-2024-001';
    
    const year = new Date().getFullYear();
    const number = settings.nextInvoiceNumber.toString().padStart(3, '0');
    return `${settings.invoicePrefix}-${year}-${number}`;
  }

  // Nächste Rechnungsnummer aktualisieren
  private updateNextInvoiceNumber(): void {
    this.companySettings.update(settings => 
      settings ? { ...settings, nextInvoiceNumber: settings.nextInvoiceNumber + 1 } : null
    );
  }

  // Position hinzufügen
  addInvoiceItem(invoiceId: string, itemData: Omit<InvoiceItem, 'id' | 'netAmount' | 'taxAmount' | 'grossAmount'>): void {
    // Beträge berechnen
    const calculated = this.calculateInvoiceItem(
      itemData.quantity, 
      itemData.unitPrice, 
      itemData.taxRate, 
      itemData.discount || 0
    );

    const itemWithId: InvoiceItem = {
      ...itemData,
      id: Date.now().toString(),
      ...calculated
    };

    this.invoices.update(invoices =>
      invoices.map(invoice =>
        invoice.id === invoiceId
          ? { 
              ...invoice, 
              items: [...invoice.items, itemWithId],
              updatedAt: new Date()
            }
          : invoice
      )
    );

    this.recalculateInvoice(invoiceId);
  }

  // Position aktualisieren
  updateInvoiceItem(invoiceId: string, itemId: string, itemData: Partial<Omit<InvoiceItem, 'id'>>): void {
    this.invoices.update(invoices =>
      invoices.map(invoice => {
        if (invoice.id !== invoiceId) return invoice;

        const updatedItems = invoice.items.map(item => {
          if (item.id !== itemId) return item;

          const updated = { ...item, ...itemData };
          
          // Neu berechnen wenn relevante Felder geändert wurden
          if (itemData.quantity !== undefined || itemData.unitPrice !== undefined || 
              itemData.taxRate !== undefined || itemData.discount !== undefined) {
            const calculated = this.calculateInvoiceItem(
              updated.quantity, 
              updated.unitPrice, 
              updated.taxRate, 
              updated.discount || 0
            );
            return { ...updated, ...calculated };
          }
          
          return updated;
        });

        return { ...invoice, items: updatedItems, updatedAt: new Date() };
      })
    );

    this.recalculateInvoice(invoiceId);
  }

  // Position entfernen
  removeInvoiceItem(invoiceId: string, itemId: string): void {
    this.invoices.update(invoices =>
      invoices.map(invoice =>
        invoice.id === invoiceId
          ? { 
              ...invoice, 
              items: invoice.items.filter(item => item.id !== itemId),
              updatedAt: new Date()
            }
          : invoice
      )
    );

    this.recalculateInvoice(invoiceId);
  }

  // Rechnung neu berechnen
  private recalculateInvoice(invoiceId: string): void {
    this.invoices.update(invoices =>
      invoices.map(invoice => {
        if (invoice.id !== invoiceId) return invoice;

        const subtotal = invoice.items.reduce((sum, item) => sum + item.netAmount, 0);
        const taxAmount = invoice.items.reduce((sum, item) => sum + item.taxAmount, 0);
        const total = subtotal + taxAmount;

        return {
          ...invoice,
          subtotal,
          taxAmount,
          total,
          updatedAt: new Date()
        };
      })
    );
  }

  // Rechnungsposition berechnen
  calculateInvoiceItem(
    quantity: number, 
    unitPrice: number, 
    taxRate: number, 
    discount: number = 0
  ): Pick<InvoiceItem, 'netAmount' | 'taxAmount' | 'grossAmount'> {
    const netAmount = quantity * unitPrice * (1 - discount / 100);
    const taxAmount = netAmount * (taxRate / 100);
    const grossAmount = netAmount + taxAmount;

    return {
      netAmount: Math.round(netAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      grossAmount: Math.round(grossAmount * 100) / 100
    };
  }

  // Rechnung senden
  sendInvoice(invoiceId: string): void {
    this.invoices.update(invoices =>
      invoices.map(invoice =>
        invoice.id === invoiceId
          ? { ...invoice, status: 'sent', updatedAt: new Date() }
          : invoice
      )
    );
  }

  // Rechnung als bezahlt markieren
  markAsPaid(invoiceId: string, paidAmount?: number, paidDate?: Date): void {
    this.invoices.update(invoices =>
      invoices.map(invoice => {
        if (invoice.id !== invoiceId) return invoice;
        
        return {
          ...invoice,
          status: 'paid',
          paidAmount: paidAmount || invoice.total,
          paidDate: paidDate || new Date(),
          updatedAt: new Date()
        };
      })
    );
  }

  // Überfällige Rechnungen prüfen
  checkOverdueInvoices(): void {
    const today = new Date();
    
    this.invoices.update(invoices =>
      invoices.map(invoice => {
        if (invoice.status === 'sent' && invoice.dueDate < today) {
          return { ...invoice, status: 'overdue', updatedAt: new Date() };
        }
        return invoice;
      })
    );
  }

  // Rechnung finden
  getInvoiceById(invoiceId: string): Invoice | undefined {
    return this.invoices().find(inv => inv.id === invoiceId);
  }

  // Firmeneinstellungen aktualisieren
  updateCompanySettings(settings: CompanySettings): void {
    this.companySettings.set(settings);
  }

  // Firmeneinstellungen abrufen
  getCompanySettings(): CompanySettings | null {
    return this.companySettings();
  }

  // Deutsche Rechtlichkeitsprüfung
  validateInvoiceForGermany(invoice: Invoice, client: Client): string[] {
    const errors: string[] = [];
    const settings = this.companySettings();

    if (!settings) {
      errors.push('Firmeneinstellungen fehlen');
      return errors;
    }

    // Pflichtangaben prüfen
    if (!invoice.invoiceNumber) errors.push('Rechnungsnummer fehlt');
    if (!invoice.invoiceDate) errors.push('Rechnungsdatum fehlt');
    if (!invoice.deliveryDate) errors.push('Leistungsdatum fehlt');
    if (!client.address.street) errors.push('Kundenadresse unvollständig');
    if (!settings.address.street) errors.push('Eigene Adresse unvollständig');
    
    // USt-ID bei Geschäftskunden
    if (client.companyType === 'company' && !client.vatId && !settings.isSmallBusiness) {
      errors.push('USt-IdNr. des Kunden fehlt für Geschäftskunden');
    }

    // Steuernummer oder USt-ID
    if (!settings.taxNumber && !settings.vatId) {
      errors.push('Steuernummer oder USt-IdNr. fehlt');
    }

    // Positionen prüfen
    if (invoice.items.length === 0) {
      errors.push('Rechnungspositionen fehlen');
    }

    return errors;
  }
}