import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Client {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  projectCount: number;
  revenue: number;
  initials: string;
}

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.clients = [
      {
        id: '1',
        name: 'Fliesen Runnbaum GmbH',
        contact: 'Hans Runnbaum',
        email: 'info@fliesen-runnbaum.de',
        phone: '+49 30 12345678',
        projectCount: 1,
        revenue: 4500,
        initials: 'FR'
      },
      {
        id: '2',
        name: 'Dr. Müller Zahnärzte',
        contact: 'Dr. Sarah Müller',
        email: 'praxis@dr-mueller.de',
        phone: '+49 40 87654321',
        projectCount: 1,
        revenue: 3200,
        initials: 'DM'
      },
      {
        id: '3',
        name: 'Bäckerei Weber',
        contact: 'Klaus Weber',
        email: 'info@baeckerei-weber.de',
        phone: '+49 89 11223344',
        projectCount: 1,
        revenue: 2800,
        initials: 'BW'
      }
    ];
  }
}