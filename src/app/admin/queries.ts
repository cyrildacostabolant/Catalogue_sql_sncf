import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Query } from '../types';

@Component({
  selector: 'app-admin-queries',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <div class="p-8 max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">Catalogue des Requêtes</h1>
          <p class="text-slate-500">Gérez les requêtes SQL disponibles pour les consultants.</p>
        </div>
        <button routerLink="/admin/queries/new" class="px-4 py-2 bg-primary text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-600 transition-all">
          <mat-icon>add</mat-icon> Nouvelle Requête
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (query of queries(); track query.id) {
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all group">
            <div class="flex items-start justify-between mb-4">
              <div class="p-2 bg-blue-50 text-primary rounded-lg">
                <mat-icon>code</mat-icon>
              </div>
              <div class="flex gap-1">
                <button [routerLink]="['/admin/queries', query.id]" class="p-2 text-slate-400 hover:text-primary transition-colors">
                  <mat-icon>edit</mat-icon>
                </button>
                <button (click)="deleteQuery(query)" class="p-2 text-slate-400 hover:text-danger transition-colors">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
            <h3 class="font-bold text-slate-900 mb-2">{{ query.title }}</h3>
            <div class="flex flex-wrap gap-2 mb-4">
              <span class="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md">
                {{ query.sub_categories?.categories?.name }}
              </span>
              <span class="px-2 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase rounded-md">
                {{ query.sub_categories?.name }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              @for (group of query.allowed_groups; track group) {
                <span class="w-2 h-2 rounded-full" [class]="group === 'CDS AU' ? 'bg-accent' : 'bg-primary'" [title]="group"></span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class AdminQueriesComponent implements OnInit {
  private supabase = inject(SupabaseService);
  queries = signal<Query[]>([]);

  ngOnInit() {
    this.loadQueries();
  }

  async loadQueries() {
    try {
      const { data, error } = await this.supabase.client
        .from('queries')
        .select('*, sub_categories(name, categories(name))')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erreur lors du chargement des requêtes:', error);
        alert(`Erreur lors du chargement des requêtes: ${error.message}`);
        return;
      }
      
      if (data) this.queries.set(data as unknown as Query[]);
    } catch (e: unknown) {
      const error = e as Error;
      console.error('Erreur critique:', error);
    }
  }

  async deleteQuery(query: Query) {
    if (confirm('Supprimer cette requête ?')) {
      await this.supabase.client.from('queries').delete().eq('id', query.id);
      this.loadQueries();
    }
  }
}
