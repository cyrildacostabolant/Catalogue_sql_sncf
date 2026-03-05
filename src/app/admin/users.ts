import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Profile } from '../types';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="p-8 max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">Gestion des Utilisateurs</h1>
          <p class="text-slate-500">Validez les nouveaux consultants et assignez-les à des groupes.</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Consultant</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Groupe</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (user of users(); track user.id) {
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                      {{ user.full_name?.charAt(0) }}
                    </div>
                    <div>
                      <div class="font-bold text-slate-900">{{ user.full_name }}</div>
                      <div class="text-xs text-slate-500">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span [class]="getStatusClass(user.status)" class="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {{ user.status }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <select [(ngModel)]="user.user_group" (change)="updateUser(user)"
                    class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-primary">
                    <option [ngValue]="null">Aucun</option>
                    <option value="MOASI ERP Achats">MOASI ERP Achats</option>
                    <option value="CDS AU">CDS AU</option>
                  </select>
                </td>
                <td class="px-6 py-4">
                  <div class="flex gap-2">
                    @if (user.status === 'PENDING') {
                      <button (click)="approveUser(user)" class="p-2 text-success hover:bg-emerald-50 rounded-lg transition-all" title="Approuver">
                        <mat-icon>check_circle</mat-icon>
                      </button>
                    }
                    @if (user.status !== 'REVOKED' && !user.is_admin) {
                      <button (click)="revokeUser(user)" class="p-2 text-danger hover:bg-red-50 rounded-lg transition-all" title="Révoquer">
                        <mat-icon>block</mat-icon>
                      </button>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  private supabase = inject(SupabaseService);
  users = signal<Profile[]>([]);

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    const { data } = await this.supabase.client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) this.users.set(data);
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700';
      case 'PENDING': return 'bg-amber-100 text-amber-700';
      case 'REVOKED': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  async approveUser(user: Profile) {
    const { error } = await this.supabase.client
      .from('profiles')
      .update({ status: 'APPROVED' })
      .eq('id', user.id);
    if (!error) this.loadUsers();
  }

  async revokeUser(user: Profile) {
    const { error } = await this.supabase.client
      .from('profiles')
      .update({ status: 'REVOKED' })
      .eq('id', user.id);
    if (!error) this.loadUsers();
  }

  async updateUser(user: Profile) {
    await this.supabase.client
      .from('profiles')
      .update({ user_group: user.user_group })
      .eq('id', user.id);
  }
}
