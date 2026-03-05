import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Category, SubCategory } from '../types';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="p-8 max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">Gestion des Catégories</h1>
          <p class="text-slate-500">Organisez votre catalogue par thématiques et sous-thématiques.</p>
        </div>
        <button (click)="addCategory()" class="px-4 py-2 bg-primary text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-600 transition-all">
          <mat-icon>add</mat-icon> Nouvelle Catégorie
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        @for (cat of categories(); track cat.id) {
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <input type="color" [(ngModel)]="cat.color_code" (change)="updateCategory(cat)" class="w-8 h-8 rounded-lg cursor-pointer border-none">
                <input type="text" [(ngModel)]="cat.name" (blur)="updateCategory(cat)" 
                  class="text-xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-primary outline-none px-1">
              </div>
              <button (click)="deleteCategory(cat)" class="text-slate-300 hover:text-danger transition-colors">
                <mat-icon>delete</mat-icon>
              </button>
            </div>

            <div class="space-y-2">
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sous-catégories</div>
              @for (sub of cat.sub_categories; track sub.id) {
                <div class="flex items-center justify-between group bg-slate-50 p-2 rounded-lg">
                  <input type="text" [(ngModel)]="sub.name" (blur)="updateSubCategory(sub)"
                    class="bg-transparent text-sm text-slate-700 outline-none flex-1">
                  <button (click)="deleteSubCategory(sub)" class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-danger transition-all">
                    <mat-icon class="text-sm">close</mat-icon>
                  </button>
                </div>
              }
              <button (click)="addSubCategory(cat)" class="w-full py-2 border-2 border-dashed border-slate-200 text-slate-400 rounded-lg text-sm hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                <mat-icon class="text-sm">add</mat-icon> Ajouter une sous-catégorie
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class AdminCategoriesComponent implements OnInit {
  private supabase = inject(SupabaseService);
  categories = signal<Category[]>([]);

  ngOnInit() {
    this.loadCategories();
  }

  async loadCategories() {
    const { data } = await this.supabase.client
      .from('categories')
      .select('*, sub_categories(*)');
    if (data) this.categories.set(data);
  }

  async addCategory() {
    const { data } = await this.supabase.client
      .from('categories')
      .insert({ name: 'Nouvelle Catégorie' })
      .select()
      .single();
    if (data) this.loadCategories();
  }

  async updateCategory(cat: Category) {
    await this.supabase.client
      .from('categories')
      .update({ name: cat.name, color_code: cat.color_code })
      .eq('id', cat.id);
  }

  async deleteCategory(cat: Category) {
    if (confirm('Supprimer cette catégorie et toutes ses sous-catégories ?')) {
      await this.supabase.client.from('categories').delete().eq('id', cat.id);
      this.loadCategories();
    }
  }

  async addSubCategory(cat: Category) {
    await this.supabase.client
      .from('sub_categories')
      .insert({ name: 'Nouvelle sous-catégorie', category_id: cat.id });
    this.loadCategories();
  }

  async updateSubCategory(sub: SubCategory) {
    await this.supabase.client
      .from('sub_categories')
      .update({ name: sub.name })
      .eq('id', sub.id);
  }

  async deleteSubCategory(sub: SubCategory) {
    await this.supabase.client.from('sub_categories').delete().eq('id', sub.id);
    this.loadCategories();
  }
}
