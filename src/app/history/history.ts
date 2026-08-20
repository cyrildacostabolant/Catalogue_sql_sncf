import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Query, Category } from '../types';

interface QueryHistoryItem {
  query: Query;
  actionType: 'CREATED' | 'UPDATED';
  eventDate: Date;
  createdDate: Date;
  updatedDate: Date;
  categoryName: string;
  categoryColor: string;
  subCategoryName: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, FormsModule],
  template: `
    <div class="p-8 max-w-6xl mx-auto space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              Journal d'activité
            </span>
          </div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Historique des Requêtes</h1>
          <p class="text-slate-500 mt-1">Suivez les créations et modifications récentes du catalogue SQL.</p>
        </div>

        <!-- Quick Summary Stats -->
        <div class="flex items-center gap-3">
          <div class="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <mat-icon class="text-lg">add_circle</mat-icon>
            </div>
            <div>
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Créations</p>
              <p class="text-lg font-bold text-slate-900 leading-none">{{ createdCount() }}</p>
            </div>
          </div>

          <div class="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <mat-icon class="text-lg">edit_note</mat-icon>
            </div>
            <div>
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Modifications</p>
              <p class="text-lg font-bold text-slate-900 leading-none">{{ updatedCount() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls: Filters & Search -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
          <!-- Search Bar -->
          <div class="md:col-span-6 relative">
            <mat-icon class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</mat-icon>
            <input 
              id="history-search-input"
              type="text" 
              [ngModel]="searchQuery()" 
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Rechercher par titre, catégorie ou code SQL..."
              class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-all">
            @if (searchQuery()) {
              <button 
                id="clear-search-btn"
                (click)="searchQuery.set('')" 
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                <mat-icon class="text-lg">close</mat-icon>
              </button>
            }
          </div>

          <!-- Category Filter -->
          <div class="md:col-span-3">
            <select 
              id="history-category-filter"
              [ngModel]="selectedCategory()" 
              (ngModelChange)="selectedCategory.set($event)"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm cursor-pointer">
              <option value="">Toutes les catégories</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.name">{{ cat.name }}</option>
              }
            </select>
          </div>

          <!-- Sort Filter -->
          <div class="md:col-span-3">
            <select 
              id="history-sort-filter"
              [ngModel]="sortOrder()" 
              (ngModelChange)="sortOrder.set($event)"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none text-sm cursor-pointer">
              <option value="recent">Activité la plus récente</option>
              <option value="created_desc">Créations récentes</option>
              <option value="updated_desc">Modifications récentes</option>
              <option value="title_asc">Titre (A → Z)</option>
            </select>
          </div>
        </div>

        <!-- Filter Chips -->
        <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span class="text-xs font-semibold text-slate-400 mr-1">Filtrer par type :</span>
          <button 
            id="filter-type-all"
            (click)="filterType.set('ALL')"
            [class]="filterType() === 'ALL' ? 'bg-primary text-white font-bold shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            class="px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5">
            <mat-icon class="text-sm">list</mat-icon>
            Tous ({{ totalCount() }})
          </button>

          <button 
            id="filter-type-created"
            (click)="filterType.set('CREATED')"
            [class]="filterType() === 'CREATED' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'"
            class="px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5">
            <mat-icon class="text-sm">add_circle</mat-icon>
            Nouveautés / Ajouts ({{ createdCount() }})
          </button>

          <button 
            id="filter-type-updated"
            (click)="filterType.set('UPDATED')"
            [class]="filterType() === 'UPDATED' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'"
            class="px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5">
            <mat-icon class="text-sm">update</mat-icon>
            Modifications ({{ updatedCount() }})
          </button>
        </div>
      </div>

      <!-- History Activity List -->
      @if (loading()) {
        <div class="py-16 flex flex-col items-center justify-center text-slate-400">
          <div class="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p class="text-sm font-medium">Chargement de l'historique...</p>
        </div>
      } @else {
        <div class="space-y-4">
          @for (item of filteredHistoryItems(); track item.query.id + '-' + item.actionType) {
            <div 
              [id]="'history-item-' + item.query.id"
              class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
                
                <!-- Left: Info & Badges -->
                <div class="flex-1 space-y-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <!-- Action Badge -->
                    @if (item.actionType === 'CREATED') {
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <mat-icon class="text-xs">add_circle</mat-icon>
                        Nouvelle requête ajoutée
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <mat-icon class="text-xs">edit_note</mat-icon>
                        Requête modifiée
                      </span>
                    }

                    <!-- Category & Subcategory Badges -->
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                      <span class="w-2 h-2 rounded-full" [style.backgroundColor]="item.categoryColor || '#3b82f6'"></span>
                      {{ item.categoryName }}
                    </span>

                    <span class="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200/60">
                      {{ item.subCategoryName }}
                    </span>

                    <!-- Groups Badges -->
                    @for (group of item.query.allowed_groups; track group) {
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                        [class]="group === 'CDS AU' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'">
                        {{ group }}
                      </span>
                    }
                  </div>

                  <!-- Query Title -->
                  <div>
                    <h2 class="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                      <a [routerLink]="['/catalog', item.query.id]" class="hover:underline">
                        {{ item.query.title }}
                      </a>
                    </h2>
                  </div>

                  <!-- Date Meta & Dynamic fields info -->
                  <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                    <div class="flex items-center gap-1.5">
                      <mat-icon class="text-slate-400 text-base">event</mat-icon>
                      <span>Créée le <strong>{{ item.createdDate | date:'dd/MM/yyyy à HH:mm' }}</strong></span>
                    </div>

                    @if (item.actionType === 'UPDATED' || isSignificantlyModified(item.createdDate, item.updatedDate)) {
                      <div class="flex items-center gap-1.5 text-blue-600">
                        <mat-icon class="text-base">update</mat-icon>
                        <span>Dernière modification le <strong>{{ item.updatedDate | date:'dd/MM/yyyy à HH:mm' }}</strong></span>
                      </div>
                    }

                    @if (item.query.dynamic_fields && item.query.dynamic_fields.length > 0) {
                      <div class="flex items-center gap-1.5 text-slate-400">
                        <mat-icon class="text-base">tune</mat-icon>
                        <span>{{ item.query.dynamic_fields.length }} paramètre(s) dynamique(s)</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Right: Action Buttons -->
                <div class="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                  <a [routerLink]="['/catalog', item.query.id]"
                    class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-primary hover:text-white text-slate-700 font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm">
                    <mat-icon class="text-sm">visibility</mat-icon>
                    Voir dans le catalogue
                  </a>

                  @if (isAdmin()) {
                    <a [routerLink]="['/admin/queries', item.query.id]"
                      title="Modifier la requête"
                      class="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-primary transition-all border border-slate-200">
                      <mat-icon class="text-base">edit</mat-icon>
                    </a>
                  }
                </div>
              </div>
            </div>
          } @empty {
            <div class="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
              <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <mat-icon class="text-2xl">history_toggle_off</mat-icon>
              </div>
              <h3 class="font-bold text-slate-800 text-lg">Aucun événement d'historique trouvé</h3>
              <p class="text-sm text-slate-500 max-w-md mx-auto">
                Aucune requête ne correspond à vos filtres actuels ou à votre terme de recherche.
              </p>
              @if (searchQuery() || selectedCategory() || filterType() !== 'ALL') {
                <button 
                  id="reset-history-filters-btn"
                  (click)="resetFilters()" 
                  class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">
                  <mat-icon class="text-sm">restart_alt</mat-icon>
                  Réinitialiser les filtres
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class HistoryComponent implements OnInit {
  private supabase = inject(SupabaseService);

  loading = signal(true);
  queries = signal<Query[]>([]);
  categories = signal<Category[]>([]);

  searchQuery = signal('');
  selectedCategory = signal('');
  filterType = signal<'ALL' | 'CREATED' | 'UPDATED'>('ALL');
  sortOrder = signal<'recent' | 'created_desc' | 'updated_desc' | 'title_asc'>('recent');

  profile = this.supabase.profile;
  isAdmin = computed(() => this.profile()?.is_admin === true);

  // Check if modification date is meaningfully different from creation date (> 60 seconds)
  isSignificantlyModified(created: Date, updated: Date): boolean {
    if (!updated || !created) return false;
    return Math.abs(updated.getTime() - created.getTime()) > 60000;
  }

  // Pre-process queries into unified history items with permissions respected
  allHistoryItems = computed<QueryHistoryItem[]>(() => {
    const rawQueries = this.queries();
    const group = this.profile()?.user_group;
    const admin = this.isAdmin();

    // Filter by allowed group if not admin
    const accessibleQueries = rawQueries.filter(q =>
      admin || (group && q.allowed_groups?.includes(group))
    );

    return accessibleQueries.map(q => {
      const createdDate = new Date(q.created_at || Date.now());
      const updatedDate = q.updated_at ? new Date(q.updated_at) : createdDate;
      const isUpdated = this.isSignificantlyModified(createdDate, updatedDate);

      const categoryName = q.sub_categories?.categories?.name || 'Sans catégorie';
      const categoryColor = q.sub_categories?.categories?.color_code || '#3b82f6';
      const subCategoryName = q.sub_categories?.name || 'Sans sous-catégorie';

      const eventDate = isUpdated ? updatedDate : createdDate;

      return {
        query: q,
        actionType: isUpdated ? 'UPDATED' : 'CREATED',
        eventDate,
        createdDate,
        updatedDate,
        categoryName,
        categoryColor,
        subCategoryName
      };
    });
  });

  totalCount = computed(() => this.allHistoryItems().length);

  createdCount = computed(() => 
    this.allHistoryItems().filter(item => item.actionType === 'CREATED').length
  );

  updatedCount = computed(() => 
    this.allHistoryItems().filter(item => item.actionType === 'UPDATED').length
  );

  // Filtered and sorted items
  filteredHistoryItems = computed(() => {
    let items = [...this.allHistoryItems()];
    const search = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    const type = this.filterType();
    const sort = this.sortOrder();

    // 1. Filter by type
    if (type !== 'ALL') {
      items = items.filter(item => item.actionType === type);
    }

    // 2. Filter by category
    if (category) {
      items = items.filter(item => item.categoryName === category);
    }

    // 3. Search query
    if (search) {
      items = items.filter(item => 
        item.query.title.toLowerCase().includes(search) ||
        item.categoryName.toLowerCase().includes(search) ||
        item.subCategoryName.toLowerCase().includes(search) ||
        (item.query.sql_content && item.query.sql_content.toLowerCase().includes(search))
      );
    }

    // 4. Sorting
    items.sort((a, b) => {
      if (sort === 'recent') {
        return b.eventDate.getTime() - a.eventDate.getTime();
      } else if (sort === 'created_desc') {
        return b.createdDate.getTime() - a.createdDate.getTime();
      } else if (sort === 'updated_desc') {
        return b.updatedDate.getTime() - a.updatedDate.getTime();
      } else if (sort === 'title_asc') {
        return a.query.title.localeCompare(b.query.title);
      }
      return 0;
    });

    return items;
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      // Fetch categories
      const { data: catData } = await this.supabase.client
        .from('categories')
        .select('*')
        .order('name');
      if (catData) this.categories.set(catData);

      // Fetch queries with sub_categories, categories and dynamic_fields
      const { data: qData, error } = await this.supabase.client
        .from('queries')
        .select('*, dynamic_fields(*), sub_categories(name, category_id, categories(name, color_code))')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement requêtes historique:', error);
      } else if (qData) {
        this.queries.set(qData as unknown as Query[]);
      }
    } catch (err) {
      console.error('Erreur critique historique:', err);
    } finally {
      this.loading.set(false);
    }
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.filterType.set('ALL');
    this.sortOrder.set('recent');
  }
}
