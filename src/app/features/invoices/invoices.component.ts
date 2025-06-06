import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../core/services/invoice.service';
import { Invoice, InvoiceItem, Client } from '../../core/models/interfaces';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.scss'
})
export class InvoicesComponent implements OnInit {
  // Signals für UI State
  selectedFilter = signal<string>('all');
  showModal = signal<boolean>(false);
  modalMode = signal<'create' | 'edit' | 'view'>('create');
  selectedInvoice = signal<Invoice | null>(null);
  
  // Item Editor State
  showItemModal = signal<boolean>(false);
  editingItem = signal<InvoiceItem | null>(null);
  currentItemData = signal<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discount: number;
    taxRate: number;
  }>({
    description: '',
    quantity: 1,
    unit: 'Stunden',
    unitPrice: 0,
    discount: 0,
    taxRate: 19
  });
  
  // Mock Clients für Demo
  clients = signal<Client[]>([
    {
      id: '1',
      name: 'Fliesen Runnbaum GmbH',
      email: 'info@fliesen-runnbaum.de',
      phone: '+49 30 12345678',
      address: {
        street: 'Musterstraße',
        houseNumber: '123',
        postalCode: '12345',
        city: 'Berlin',
        country: 'Deutschland'
      },
      projects: ['1'],
      totalRevenue: 4500,
      status: 'active',
      createdAt: new Date(),
      companyType: 'company',
      vatId: 'DE987654321'
    },
    {
      id: '2', 
      name: 'Dr. Müller Zahnärzte',
      email: 'praxis@dr-mueller.de',
      phone: '+49 40 87654321',
      address: {
        street: 'Zahnarztstraße',
        houseNumber: '456',
        postalCode: '20095',
        city: 'Hamburg',
        country: 'Deutschland'
      },
      projects: ['2'],
      totalRevenue: 3200,
      status: 'active',
      createdAt: new Date(),
      companyType: 'company'
    }
  ]);

  // Computed Signals für gefilterte Rechnungen
  filteredInvoices = computed(() => {
    const filter = this.selectedFilter();
    const allInvoices = this.invoiceService.allInvoices();
    
    switch(filter) {
      case 'draft': return this.invoiceService.draftInvoices();
      case 'sent': return this.invoiceService.sentInvoices();
      case 'paid': return this.invoiceService.paidInvoices();
      case 'overdue': return this.invoiceService.overdueInvoices();
      default: return allInvoices;
    }
  });

  constructor(public invoiceService: InvoiceService) {}

  ngOnInit(): void {
    // Überfällige Rechnungen prüfen
    this.invoiceService.checkOverdueInvoices();
  }

  // Modal-Funktionen
  openCreateInvoiceModal(): void {
    this.modalMode.set('create');
    this.selectedInvoice.set(null);
    this.showModal.set(true);
  }

  openEditInvoiceModal(invoice: Invoice): void {
    this.modalMode.set('edit');
    this.selectedInvoice.set(invoice);
    this.showModal.set(true);
  }

  openViewInvoiceModal(invoice: Invoice): void {
    this.modalMode.set('view');
    this.selectedInvoice.set(invoice);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedInvoice.set(null);
  }

  // Neue Rechnung erstellen
  createInvoice(clientId: string, projectId?: string): void {
    try {
      const invoice = this.invoiceService.createInvoice(clientId, projectId);
      this.openEditInvoiceModal(invoice);
    } catch (error) {
      alert('Fehler beim Erstellen der Rechnung: ' + error);
    }
  }

  // Rechnung senden
  sendInvoice(invoiceId: string): void {
    if (confirm('Rechnung wirklich senden? Sie kann danach nicht mehr bearbeitet werden.')) {
      this.invoiceService.sendInvoice(invoiceId);
    }
  }

  // Als bezahlt markieren
  markInvoiceAsPaid(invoiceId: string): void {
    if (confirm('Rechnung als bezahlt markieren?')) {
      this.invoiceService.markAsPaid(invoiceId);
    }
  }

  // Rechnung löschen
  deleteInvoice(invoiceId: string): void {
    if (confirm('Rechnung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      // TODO: Implementieren
      console.log('Delete invoice:', invoiceId);
    }
  }

  // Client-Name finden
  getClientName(clientId: string): string {
    const client = this.clients().find(c => c.id === clientId);
    return client ? client.name : 'Unbekannter Kunde';
  }

  // Status-Styling
  getStatusClass(status: string): string {
    const statusClasses = {
      'draft': 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
      'sent': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      'paid': 'bg-green-500/20 text-green-400 border border-green-500/30',
      'overdue': 'bg-red-500/20 text-red-400 border border-red-500/30'
    };
    return statusClasses[status as keyof typeof statusClasses] || '';
  }

  getStatusLabel(status: string): string {
    const statusLabels = {
      'draft': 'Entwurf',
      'sent': 'Versendet',
      'paid': 'Bezahlt',
      'overdue': 'Überfällig'
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  }

  // Filter ändern
  setFilter(filter: string): void {
    this.selectedFilter.set(filter);
  }

  // Item-Editor Funktionen
  openAddItemModal(): void {
    this.editingItem.set(null);
    this.currentItemData.set({
      description: '',
      quantity: 1,
      unit: 'Stunden',
      unitPrice: 0,
      discount: 0,
      taxRate: 19
    });
    this.showItemModal.set(true);
  }

  openEditItemModal(item: InvoiceItem): void {
    this.editingItem.set(item);
    this.currentItemData.set({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      taxRate: item.taxRate
    });
    this.showItemModal.set(true);
  }

  closeItemModal(): void {
    this.showItemModal.set(false);
    this.editingItem.set(null);
  }

  saveInvoiceItem(): void {
    const invoice = this.selectedInvoice();
    if (!invoice) return;

    const itemData = this.currentItemData();
    
    if (this.editingItem()) {
      // Item aktualisieren
      this.invoiceService.updateInvoiceItem(
        invoice.id, 
        this.editingItem()!.id, 
        itemData
      );
    } else {
      // Neues Item hinzufügen
      this.invoiceService.addInvoiceItem(invoice.id, itemData);
    }
    
    this.closeItemModal();
    
    // Invoice neu laden für aktualisierte Ansicht
    this.selectedInvoice.set(this.invoiceService.getInvoiceById(invoice.id) || null);
  }

  removeInvoiceItem(itemId: string): void {
    const invoice = this.selectedInvoice();
    if (!invoice) return;

    if (confirm('Position wirklich entfernen?')) {
      this.invoiceService.removeInvoiceItem(invoice.id, itemId);
      // Invoice neu laden
      this.selectedInvoice.set(this.invoiceService.getInvoiceById(invoice.id) || null);
    }
  }

  // Vorschau-Berechnung für Item-Editor
  getItemPreview(): { netAmount: number; taxAmount: number; grossAmount: number } {
    const data = this.currentItemData();
    return this.invoiceService.calculateInvoiceItem(
      data.quantity,
      data.unitPrice,
      data.taxRate,
      data.discount
    );
  }

  // Häufige Dienstleistungen/Produkte
  getCommonServices(): Array<{name: string; unit: string; defaultPrice: number}> {
    return [
      { name: 'Frontend Entwicklung', unit: 'Stunden', defaultPrice: 75 },
      { name: 'Backend Entwicklung', unit: 'Stunden', defaultPrice: 85 },
      { name: 'UI/UX Design', unit: 'Stunden', defaultPrice: 65 },
      { name: 'Projektmanagement', unit: 'Stunden', defaultPrice: 55 },
      { name: 'Website Setup (Pauschal)', unit: 'Pauschal', defaultPrice: 500 },
      { name: 'SEO Optimierung', unit: 'Stunden', defaultPrice: 70 },
      { name: 'Bugfixing', unit: 'Stunden', defaultPrice: 80 },
      { name: 'Hosting Setup', unit: 'Pauschal', defaultPrice: 150 }
    ];
  }

  selectCommonService(service: {name: string; unit: string; defaultPrice: number}): void {
    this.currentItemData.update(data => ({
      ...data,
      description: service.name,
      unit: service.unit,
      unitPrice: service.defaultPrice
    }));
  }

  // Formatierung
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('de-DE').format(new Date(date));
  }

  // Rechnung validieren (für Deutsche Rechtssicherheit)
  validateInvoice(invoice: Invoice): string[] {
    const client = this.clients().find(c => c.id === invoice.clientId);
    if (!client) return ['Kunde nicht gefunden'];
    
    return this.invoiceService.validateInvoiceForGermany(invoice, client);
  }
}