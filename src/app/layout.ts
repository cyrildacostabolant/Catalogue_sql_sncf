import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { SupabaseService } from './supabase';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="flex h-screen bg-slate-50 overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-20">
        <div class="p-6 border-b border-slate-100 flex items-center gap-3">
          <div class="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg">
            <mat-icon>database</mat-icon>
          </div>
          <div>
            <h1 class="font-bold text-slate-900 leading-tight">Catalogue de requêtes SQL</h1>
            <span class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">SNCF ERP Achats</span>
          </div>
        </div>

        <nav class="flex-1 overflow-y-auto p-4 space-y-1">
          @if (!isConfigured()) {
            <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <div class="flex items-center gap-2 text-amber-800 font-bold text-xs mb-1">
                <mat-icon class="text-sm">warning</mat-icon>
                Configuration requise
              </div>
              <p class="text-[10px] text-amber-700 leading-relaxed">
                Configurez <strong>SUPABASE_URL</strong> et <strong>SUPABASE_ANON_KEY</strong> (Secrets AI Studio ou Env Vars Vercel).
              </p>
            </div>
          }

          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Menu Principal</div>
          
          <a routerLink="/catalog" routerLinkActive="bg-blue-50 text-primary" 
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-medium">
            <mat-icon class="text-xl">search</mat-icon>
            Catalogue
          </a>

          @if (isAdmin()) {
            <div class="pt-6 pb-2">
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Administration</div>
              
              <a routerLink="/admin/users" routerLinkActive="bg-blue-50 text-primary" 
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-medium">
                <mat-icon class="text-xl">people</mat-icon>
                Utilisateurs
              </a>
              
              <a routerLink="/admin/categories" routerLinkActive="bg-blue-50 text-primary" 
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-medium">
                <mat-icon class="text-xl">category</mat-icon>
                Catégories
              </a>

              <a routerLink="/admin/queries" routerLinkActive="bg-blue-50 text-primary" 
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-medium">
                <mat-icon class="text-xl">code</mat-icon>
                Requêtes SQL
              </a>
            </div>
          }
        </nav>

        <div class="p-4 border-t border-slate-100">
          <div class="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
            <div class="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">
              {{ profile()?.full_name?.charAt(0) || 'U' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-slate-900 truncate">{{ profile()?.full_name || 'Utilisateur' }}</p>
              <p class="text-[10px] text-slate-500 truncate">{{ profile()?.user_group || 'En attente' }}</p>
            </div>
            <button (click)="logout()" class="text-slate-400 hover:text-danger transition-colors">
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto relative">
        @if (profile()?.status === 'PENDING') {
          <div class="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center p-8 text-center">
            <div class="max-w-md">
              <mat-icon class="text-6xl text-accent mb-4">hourglass_empty</mat-icon>
              <h2 class="text-2xl font-bold text-slate-900 mb-2">Compte en attente</h2>
              <p class="text-slate-600">Votre compte doit être validé par un administrateur avant de pouvoir accéder au catalogue.</p>
              <button (click)="logout()" class="mt-6 px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition-all">
                Se déconnecter
              </button>
            </div>
          </div>
        }
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class LayoutComponent {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  profile = this.supabase.profile;
  isConfigured = this.supabase.isConfigured;
  isAdmin = computed(() => this.profile()?.is_admin === true);

  async logout() {
    await this.supabase.signOut();
    this.router.navigate(['/auth']);
  }
}
