import { Component, inject, signal, OnInit, computed } from '@angular/core';
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
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">Gestion des Utilisateurs</h1>
          <p class="text-slate-500">Validez les nouveaux consultants et gérez les accès.</p>
        </div>
        <button (click)="loadUsers()" class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm font-medium">
          <mat-icon class="text-lg">refresh</mat-icon>
          Actualiser
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex gap-4 mb-6 border-b border-slate-200">
        <button (click)="activeTab.set('pending')" 
          [class]="activeTab() === 'pending' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'"
          class="pb-4 px-2 border-b-2 font-bold text-sm transition-all flex items-center gap-2">
          En attente
          @if (pendingCount() > 0) {
            <span class="bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full">{{ pendingCount() }}</span>
          }
        </button>
        <button (click)="activeTab.set('all')" 
          [class]="activeTab() === 'all' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'"
          class="pb-4 px-2 border-b-2 font-bold text-sm transition-all">
          Tous les utilisateurs
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Consultant</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Statut</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Groupe</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (user of filteredUsers(); track user.id) {
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                      {{ user.full_name?.charAt(0) || '?' }}
                    </div>
                    <div>
                      <div class="font-bold text-slate-900">{{ user.full_name || 'Sans nom' }}</div>
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
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-2">
                    @if (user.status === 'PENDING') {
                      <button (click)="approveUser(user)" class="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all text-xs font-bold" title="Approuver">
                        <mat-icon class="text-sm">check_circle</mat-icon>
                        Approuver
                      </button>
                    }
                    @if (user.status !== 'REVOKED' && !user.is_admin) {
                      <button (click)="revokeUser(user)" class="p-2 text-slate-400 hover:text-danger hover:bg-red-50 rounded-lg transition-all" title="Révoquer l'accès">
                        <mat-icon>block</mat-icon>
                      </button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="px-6 py-12 text-center text-slate-500 italic">
                  Aucun utilisateur trouvé dans cette catégorie.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (activeTab() === 'pending' && filteredUsers().length === 0 && users().length > 0) {
        <div class="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl">
          <div class="flex gap-4">
            <mat-icon class="text-blue-500">info</mat-icon>
            <div>
              <h3 class="font-bold text-blue-900 mb-1">Note sur la visibilité</h3>
              <p class="text-sm text-blue-700 leading-relaxed">
                Si vous savez qu'un utilisateur s'est inscrit mais qu'il n'apparaît pas ici, vérifiez que :
              </p>
              <ul class="text-sm text-blue-700 list-disc ml-5 mt-2 space-y-1">
                <li>L'utilisateur a bien validé son email (si requis par Supabase).</li>
                <li>Les politiques de sécurité (RLS) de Supabase autorisent l'administrateur à voir tous les profils. 
                  <br>
                  <code class="block mt-2 p-2 bg-blue-100 rounded text-xs font-mono">
                    CREATE POLICY "Admins see all" ON profiles FOR SELECT USING ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true );
                  </code>
                </li>
              </ul>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  private supabase = inject(SupabaseService);
  users = signal<Profile[]>([]);
  activeTab = signal<'pending' | 'all'>('pending');

  filteredUsers = computed(() => {
    if (this.activeTab() === 'pending') {
      return this.users().filter(u => u.status === 'PENDING');
    }
    return this.users();
  });

  pendingCount = computed(() => this.users().filter(u => u.status === 'PENDING').length);

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
