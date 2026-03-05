import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Category, Query, SubCategory } from '../types';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <div class="flex h-full">
      <!-- Catalog Sidebar -->
      <aside class="w-64 bg-slate-50 border-r border-slate-200 overflow-y-auto p-4">
        <div class="mb-6">
          <h2 class="text-sm font-bold text-slate-400 uppercase tracking-widest px-2 mb-4">Arborescence</h2>
          
          <div class="space-y-4">
            @for (cat of categories(); track cat.id) {
              <div>
                <button (click)="toggleCategory(cat.id)" 
                  class="flex items-center justify-between w-full px-2 py-1 mb-1 hover:bg-slate-100 rounded-lg transition-all group">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full" [style.backgroundColor]="cat.color_code"></div>
                    <span class="text-sm font-bold text-slate-700">{{ cat.name }}</span>
                  </div>
                  <mat-icon class="text-slate-400 text-sm transition-transform" 
                    [class.rotate-90]="isExpanded(cat.id)">chevron_right</mat-icon>
                </button>
                
                @if (isExpanded(cat.id)) {
                  <div class="ml-4 space-y-1 border-l-2 border-slate-200 pl-3 animate-in fade-in slide-in-from-left-2 duration-200">
                    @for (sub of cat.sub_categories || []; track sub.id) {
                      <button (click)="selectSubCategory(sub)" 
                        [class]="selectedSubId() === sub.id ? 'text-primary font-bold bg-blue-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'"
                        class="block w-full text-left text-xs py-1.5 px-2 rounded-md transition-all">
                        {{ sub.name }}
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </aside>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-8">
        @if (!selectedSubId()) {
          <div class="h-full flex flex-col items-center justify-center text-slate-400">
            <mat-icon class="text-6xl mb-4">account_tree</mat-icon>
            <p class="text-lg font-medium">Sélectionnez une sous-catégorie pour voir les requêtes</p>
          </div>
        } @else {
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-slate-900">{{ selectedSubName() }}</h1>
            <p class="text-slate-500">Requêtes disponibles pour votre groupe.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (query of filteredQueries(); track query.id) {
              <a [routerLink]="['/catalog', query.id]" 
                class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-primary transition-all group">
                <div class="w-10 h-10 bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-primary rounded-xl flex items-center justify-center mb-4 transition-all">
                  <mat-icon>description</mat-icon>
                </div>
                <h3 class="font-bold text-slate-900 mb-2">{{ query.title }}</h3>
                <div class="flex items-center gap-2 text-xs text-slate-400">
                  <mat-icon class="text-sm">history</mat-icon>
                  Mis à jour le {{ query.updated_at | date:'dd/MM/yyyy' }}
                </div>
              </a>
            } @empty {
              <div class="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                Aucune requête trouvée dans cette catégorie pour votre groupe.
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class CatalogComponent implements OnInit {
  private supabase = inject(SupabaseService);
  
  categories = signal<Category[]>([]);
  queries = signal<Query[]>([]);
  selectedSubId = signal<string | null>(null);
  selectedSubName = signal<string>('');
  expandedCategories = signal<Set<string>>(new Set());

  profile = this.supabase.profile;

  filteredQueries = computed(() => {
    const subId = this.selectedSubId();
    const group = this.profile()?.user_group;
    if (!subId) return [];
    
    return this.queries().filter(q => 
      q.sub_category_id === subId && 
      (q.allowed_groups?.includes(group!) || this.profile()?.is_admin)
    );
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    const { data: cats } = await this.supabase.client
      .from('categories')
      .select('*, sub_categories(*)');
    if (cats) this.categories.set(cats);

    const { data: qs } = await this.supabase.client
      .from('queries')
      .select('*')
      .order('title');
    if (qs) this.queries.set(qs);
  }

  toggleCategory(id: string) {
    const expanded = new Set(this.expandedCategories());
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
    this.expandedCategories.set(expanded);
  }

  isExpanded(id: string) {
    return this.expandedCategories().has(id);
  }

  selectSubCategory(sub: SubCategory) {
    this.selectedSubId.set(sub.id);
    this.selectedSubName.set(sub.name);
  }
}
