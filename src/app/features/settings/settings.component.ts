import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../core/services/invoice.service';
import { CompanySettings } from '../../core/models/interfaces';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  // UI State
  activeTab = signal<'company' | 'tax' | 'banking' | 'invoice'>('company');
  isEditing = signal<boolean>(false);
  hasChanges = signal<boolean>(false);
  
  // Settings Data
  settings = signal<CompanySettings>({
    companyName: '',
    ownerName: '',
    address: {
      street: '',
      houseNumber: '',
      postalCode: '',
      city: '',
      country: 'Deutschland'
    },
    email: '',
    phone: '',
    website: '',
    
    // Steuerlich
    vatId: '',
    taxNumber: '',
    isSmallBusiness: false,
    
    // Banking
    bankName: '',
    iban: '',
    bic: '',
    
    // Rechnungen
    invoicePrefix: 'INV',
    nextInvoiceNumber: 1,
    defaultPaymentTerms: 14,
    defaultTaxRate: 19
  });

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    const currentSettings = this.invoiceService.getCompanySettings();
    if (currentSettings) {
      this.settings.set(currentSettings);
    }
  }

  startEditing(): void {
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.hasChanges.set(false);
    this.loadSettings(); // Änderungen verwerfen
  }

  saveSettings(): void {
    this.invoiceService.updateCompanySettings(this.settings());
    this.isEditing.set(false);
    this.hasChanges.set(false);
    alert('Einstellungen erfolgreich gespeichert!');
  }

  onSettingsChange(): void {
    this.hasChanges.set(true);
  }

  setActiveTab(tab: 'company' | 'tax' | 'banking' | 'invoice'): void {
    this.activeTab.set(tab);
  }

  // IBAN Validierung (vereinfacht)
  validateIban(iban: string): boolean {
    const cleanIban = iban.replace(/\s/g, '');
    return cleanIban.length >= 15 && cleanIban.length <= 34 && /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleanIban);
  }

  // Steuerliche Validierung
  validateVatId(vatId: string): boolean {
    // Deutsche USt-IdNr Format: DE123456789
    return /^DE[0-9]{9}$/.test(vatId);
  }

  validateTaxNumber(taxNumber: string): boolean {
    // Deutsche Steuernummer Format: XX/XXX/XXXXX
    return /^[0-9]{2}\/[0-9]{3}\/[0-9]{5}$/.test(taxNumber);
  }

  // IBAN Formatierung (mit Leerzeichen)
  formatIban(iban: string): string {
    return iban.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  }

  // Validierung für Vollständigkeit
  getValidationErrors(): string[] {
    const errors: string[] = [];
    const settings = this.settings();

    // Grunddaten
    if (!settings.companyName) errors.push('Firmenname fehlt');
    if (!settings.ownerName) errors.push('Inhaber-Name fehlt');
    if (!settings.email) errors.push('E-Mail-Adresse fehlt');
    if (!settings.phone) errors.push('Telefonnummer fehlt');
    
    // Adresse
    if (!settings.address.street) errors.push('Straße fehlt');
    if (!settings.address.houseNumber) errors.push('Hausnummer fehlt');
    if (!settings.address.postalCode) errors.push('PLZ fehlt');
    if (!settings.address.city) errors.push('Stadt fehlt');
    
    // Steuerlich
    if (!settings.isSmallBusiness) {
      if (!settings.vatId || !this.validateVatId(settings.vatId)) {
        errors.push('Gültige USt-IdNr. fehlt (Format: DE123456789)');
      }
    }
    if (!settings.taxNumber || !this.validateTaxNumber(settings.taxNumber)) {
      errors.push('Gültige Steuernummer fehlt (Format: 12/345/67890)');
    }
    
    // Banking
    if (!settings.bankName) errors.push('Bankname fehlt');
    if (!settings.iban || !this.validateIban(settings.iban)) {
      errors.push('Gültige IBAN fehlt');
    }
    if (!settings.bic) errors.push('BIC fehlt');

    return errors;
  }

  // Einstellungen komplett?
  isSetupComplete(): boolean {
    return this.getValidationErrors().length === 0;
  }

  // Test-Rechnung erstellen
  createTestInvoice(): void {
    if (!this.isSetupComplete()) {
      alert('Bitte vervollständigen Sie zuerst alle Firmeneinstellungen!');
      return;
    }
    
    // Hier würden wir zur Rechnungsseite navigieren
    alert('Einstellungen sind vollständig! Sie können jetzt rechtssichere Rechnungen erstellen.');
  }

  // Daten zurücksetzen
  resetToDefaults(): void {
    if (confirm('Alle Einstellungen auf Standard zurücksetzen?')) {
      this.settings.set({
        companyName: '',
        ownerName: '',
        address: {
          street: '',
          houseNumber: '',
          postalCode: '',
          city: '',
          country: 'Deutschland'
        },
        email: '',
        phone: '',
        website: '',
        
        vatId: '',
        taxNumber: '',
        isSmallBusiness: false,
        
        bankName: '',
        iban: '',
        bic: '',
        
        invoicePrefix: 'INV',
        nextInvoiceNumber: 1,
        defaultPaymentTerms: 14,
        defaultTaxRate: 19
      });
      this.hasChanges.set(true);
    }
  }

  // Beispieldaten laden
  loadSampleData(): void {
    if (confirm('Beispieldaten laden? Bestehende Daten werden überschrieben.')) {
      this.settings.set({
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
        
        vatId: 'DE123456789',
        taxNumber: '12/345/67890',
        isSmallBusiness: false,
        
        bankName: 'Deutsche Bank',
        iban: 'DE89 1234 5678 9012 3456 78',
        bic: 'DEUTDEDB123',
        
        invoicePrefix: 'INV',
        nextInvoiceNumber: 1,
        defaultPaymentTerms: 14,
        defaultTaxRate: 19
      });
      this.hasChanges.set(true);
    }
  }
}