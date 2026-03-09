import { Component, inject, signal, OnInit, computed } from '@angular/core';
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

      <div class="space-y-6">
        @for (category of groupedQueries(); track category.name) {
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button (click)="toggleCategory(category.name)" class="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
              <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                {{ category.name }}
                <span class="text-sm font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{{ category.subCategories.length }}</span>
              </h2>
              <mat-icon class="text-slate-400 transition-transform" [class.rotate-180]="isCategoryExpanded(category.name)">expand_more</mat-icon>
            </button>
            
            @if (isCategoryExpanded(category.name)) {
              <div class="p-6 space-y-6 border-t border-slate-200">
                @for (subCategory of category.subCategories; track subCategory.name) {
                  <div class="border border-slate-100 rounded-xl overflow-hidden">
                    <button (click)="toggleSubCategory(category.name + '::' + subCategory.name)" class="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left">
                      <h3 class="text-md font-semibold text-slate-700 flex items-center gap-2">
                        <mat-icon class="text-slate-400 text-sm">subdirectory_arrow_right</mat-icon>
                        {{ subCategory.name }}
                        <span class="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{{ subCategory.queries.length }}</span>
                      </h3>
                      <mat-icon class="text-slate-400 transition-transform" [class.rotate-180]="isSubCategoryExpanded(category.name + '::' + subCategory.name)">expand_more</mat-icon>
                    </button>
                    
                    @if (isSubCategoryExpanded(category.name + '::' + subCategory.name)) {
                      <div class="p-4 border-t border-slate-100 bg-white">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          @for (query of subCategory.queries; track query.id) {
                            <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all group">
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
                              <div class="flex items-center gap-2">
                                @for (group of query.allowed_groups; track group) {
                                  <span class="w-2 h-2 rounded-full" [class]="group === 'CDS AU' ? 'bg-accent' : 'bg-primary'" [title]="group"></span>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
        
        @if (groupedQueries().length === 0) {
          <div class="text-center py-12 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
            Aucune requête trouvée.
          </div>
        }
      </div>
    </div>
  `
})
export class AdminQueriesComponent implements OnInit {
  private supabase = inject(SupabaseService);
  queries = signal<Query[]>([]);

  expandedCategories = signal<Set<string>>(new Set());
  expandedSubCategories = signal<Set<string>>(new Set());

  toggleCategory(catName: string) {
    const expanded = new Set(this.expandedCategories());
    if (expanded.has(catName)) {
      expanded.delete(catName);
    } else {
      expanded.add(catName);
    }
    this.expandedCategories.set(expanded);
  }

  isCategoryExpanded(catName: string) {
    return this.expandedCategories().has(catName);
  }

  toggleSubCategory(subCatKey: string) {
    const expanded = new Set(this.expandedSubCategories());
    if (expanded.has(subCatKey)) {
      expanded.delete(subCatKey);
    } else {
      expanded.add(subCatKey);
    }
    this.expandedSubCategories.set(expanded);
  }

  isSubCategoryExpanded(subCatKey: string) {
    return this.expandedSubCategories().has(subCatKey);
  }

  groupedQueries = computed(() => {
    const queries = this.queries();
    const groups = new Map<string, Map<string, Query[]>>();

    for (const q of queries) {
      const catName = q.sub_categories?.categories?.name || 'Sans catégorie';
      const subCatName = q.sub_categories?.name || 'Sans sous-catégorie';

      if (!groups.has(catName)) {
        groups.set(catName, new Map<string, Query[]>());
      }
      const catGroup = groups.get(catName)!;

      if (!catGroup.has(subCatName)) {
        catGroup.set(subCatName, []);
      }
      catGroup.get(subCatName)!.push(q);
    }

    // Convert to array for template
    return Array.from(groups.entries()).map(([catName, subCats]) => ({
      name: catName,
      subCategories: Array.from(subCats.entries()).map(([subCatName, qs]) => ({
        name: subCatName,
        queries: qs
      }))
    }));
  });

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
