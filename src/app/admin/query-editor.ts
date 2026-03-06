import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Category, SubCategory, DynamicField } from '../types';

@Component({
  selector: 'app-admin-query-editor',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-8 max-w-5xl mx-auto">
      <div class="flex items-center gap-4 mb-8">
        <button routerLink="/admin/queries" class="p-2 hover:bg-slate-200 rounded-full transition-all">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1 class="text-3xl font-bold text-slate-900">{{ isEdit ? 'Modifier' : 'Nouvelle' }} Requête SQL</h1>
          <p class="text-slate-500">Définissez le code SQL et les champs dynamiques.</p>
        </div>
      </div>

      <form [formGroup]="queryForm" (ngSubmit)="save()" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <!-- Main Info -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div>
              <label for="title" class="block text-sm font-bold text-slate-700 mb-1">Titre de la requête</label>
              <input id="title" type="text" formControlName="title" placeholder="ex: Liste des commandes par OPRID"
                class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="category" class="block text-sm font-bold text-slate-700 mb-1">Catégorie</label>
                <select id="category" (change)="onCategoryChange($event)" class="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none">
                  <option [value]="null">Sélectionner...</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id" [selected]="selectedCategoryId === cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label for="sub_category" class="block text-sm font-bold text-slate-700 mb-1">Sous-catégorie</label>
                <select id="sub_category" formControlName="sub_category_id" class="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none">
                  <option [value]="null">Sélectionner...</option>
                  @for (sub of subCategories(); track sub.id) {
                    <option [value]="sub.id">{{ sub.name }}</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <!-- SQL Editor -->
          <div class="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800">
            <div class="flex items-center justify-between mb-4">
              <label for="sql_content" class="text-sm font-bold text-slate-400 uppercase tracking-widest">Code SQL Brut</label>
              <div class="flex gap-2">
                @for (field of dynamicFields.value; track $index) {
                  @if (field.tag) {
                    <button type="button" (click)="insertTag(field.tag)" 
                      class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-mono rounded border border-slate-700 transition-all">
                      + {{ '{{' }}{{ field.tag }}{{ '}}' }}
                    </button>
                  }
                }
              </div>
            </div>
            <textarea id="sql_content" #sqlEditor formControlName="sql_content" rows="12"
              class="w-full bg-transparent text-emerald-400 font-mono text-sm outline-none resize-none"
              placeholder="SELECT * FROM table WHERE user = {{ '{{' }}user_id{{ '}}' }}"></textarea>
          </div>

          <!-- Dynamic Fields -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-slate-900">Champs Dynamiques</h3>
              <button type="button" (click)="addField()" class="text-primary hover:bg-blue-50 px-3 py-1 rounded-lg font-bold text-sm flex items-center gap-1">
                <mat-icon class="text-sm">add</mat-icon> Ajouter un champ
              </button>
            </div>

            <div formArrayName="dynamic_fields" class="space-y-3">
              @for (field of dynamicFields.controls; track $index; let i = $index) {
                <div [formGroupName]="i" class="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div class="flex gap-3 items-end">
                    <div class="flex-1">
                      <label [for]="'label-' + i" class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Label (UI)</label>
                      <input [id]="'label-' + i" type="text" formControlName="label" placeholder="ex: Code OPRID"
                        class="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none">
                    </div>
                    <div class="flex-1">
                      <label [for]="'tag-' + i" class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tag (Regex)</label>
                      <div class="flex items-center gap-1">
                        <span class="text-slate-400 text-sm">&#123;&#123;</span>
                        <input [id]="'tag-' + i" type="text" formControlName="tag" placeholder="oprid"
                          class="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm outline-none">
                        <span class="text-slate-400 text-sm">&#125;&#125;</span>
                      </div>
                    </div>
                    <button type="button" (click)="removeField(i)" class="p-2 text-slate-300 hover:text-danger transition-colors">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/50">
                    <div>
                      <label [for]="'length-' + i" class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Longueur requise (optionnel)</label>
                      <input [id]="'length-' + i" type="number" formControlName="required_length" placeholder="ex: 10"
                        class="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none">
                    </div>
                    <div>
                      <label [for]="'options-' + i" class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Options (séparées par virgule)</label>
                      <input [id]="'options-' + i" type="text" formControlName="dropdown_options_str" placeholder="ex: Option 1, Option 2"
                        class="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none">
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <!-- Visibility -->
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 class="text-lg font-bold text-slate-900 mb-4">Visibilité</h3>
            <div class="space-y-3">
              <label class="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" [checked]="isGroupSelected('MOASI ERP Achats')" (change)="toggleGroup('MOASI ERP Achats')" class="w-5 h-5 rounded text-primary">
                <span class="text-sm font-medium text-slate-700">Equipe MOASI ERP Achats</span>
              </label>
              <label class="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" [checked]="isGroupSelected('CDS AU')" (change)="toggleGroup('CDS AU')" class="w-5 h-5 rounded text-primary">
                <span class="text-sm font-medium text-slate-700">Equipe CDS AU</span>
              </label>
            </div>
          </div>

          <button type="submit" [disabled]="loading()"
            class="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            @if (loading()) {
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            }
            <mat-icon>save</mat-icon>
            Enregistrer la requête
          </button>
        </div>
      </form>
    </div>
  `
})
export class AdminQueryEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit = false;
  loading = signal(false);
  categories = signal<Category[]>([]);
  subCategories = signal<SubCategory[]>([]);
  selectedCategoryId: string | null = null;
  allowedGroups: string[] = [];

  queryForm = this.fb.group({
    title: ['', Validators.required],
    sql_content: ['', Validators.required],
    sub_category_id: [null as string | null, Validators.required],
    dynamic_fields: this.fb.array([])
  });

  get dynamicFields() {
    return this.queryForm.get('dynamic_fields') as FormArray;
  }

  insertTag(tag: string) {
    const textarea = document.getElementById('sql_content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const tagToInsert = `{{${tag}}}`;
    
    const newValue = text.substring(0, start) + tagToInsert + text.substring(end);
    this.queryForm.patchValue({ sql_content: newValue });
    
    // Reset focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + tagToInsert.length;
    });
  }

  ngOnInit() {
    this.loadCategories();
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.loadQuery(id);
    }
  }

  async loadCategories() {
    const { data } = await this.supabase.client.from('categories').select('*');
    if (data) this.categories.set(data);
  }

  async onCategoryChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedCategoryId = target.value;
    if (this.selectedCategoryId) {
      const { data } = await this.supabase.client
        .from('sub_categories')
        .select('*')
        .eq('category_id', this.selectedCategoryId);
      if (data) this.subCategories.set(data);
    } else {
      this.subCategories.set([]);
    }
  }

  async loadQuery(id: string) {
    const { data } = await this.supabase.client
      .from('queries')
      .select('*, dynamic_fields(*), sub_categories(category_id)')
      .eq('id', id)
      .single();

    if (data) {
      this.allowedGroups = data.allowed_groups || [];
      this.selectedCategoryId = data.sub_categories.category_id;
      
      // Load subcategories for the selected category
      const { data: subs } = await this.supabase.client
        .from('sub_categories')
        .select('*')
        .eq('category_id', this.selectedCategoryId);
      if (subs) this.subCategories.set(subs);

      this.queryForm.patchValue({
        title: data.title,
        sql_content: data.sql_content,
        sub_category_id: data.sub_category_id
      });

      data.dynamic_fields.forEach((f: DynamicField) => {
        let required_length = f.required_length;
        let dropdown_options = f.dropdown_options;

        // Try to parse from placeholder if columns are empty (backward compatibility or new storage strategy)
        if (!required_length && !dropdown_options && f.placeholder) {
          try {
            const config = JSON.parse(f.placeholder);
            if (config.required_length) required_length = config.required_length;
            if (config.dropdown_options) dropdown_options = config.dropdown_options;
          } catch (e) {
            // Not JSON, ignore
          }
        }

        this.dynamicFields.push(this.fb.group({
          label: [f.label, Validators.required],
          tag: [f.tag, Validators.required],
          required_length: [required_length],
          dropdown_options_str: [dropdown_options ? dropdown_options.join(', ') : '']
        }));
      });
    }
  }

  addField() {
    this.dynamicFields.push(this.fb.group({
      label: ['', Validators.required],
      tag: ['', Validators.required],
      required_length: [null],
      dropdown_options_str: ['']
    }));
  }

  removeField(index: number) {
    this.dynamicFields.removeAt(index);
  }

  isGroupSelected(group: string) {
    return this.allowedGroups.includes(group);
  }

  toggleGroup(group: string) {
    if (this.isGroupSelected(group)) {
      this.allowedGroups = this.allowedGroups.filter(g => g !== group);
    } else {
      this.allowedGroups.push(group);
    }
  }

  async save() {
    if (this.queryForm.invalid) return;
    this.loading.set(true);

    const { title, sql_content, sub_category_id } = this.queryForm.value;
    const rawFields = this.dynamicFields.value;
    
    // Process fields to convert string options to array and pack into placeholder
    const fields = rawFields.map((f: { label: string; tag: string; required_length?: number; dropdown_options_str?: string }) => {
      const dropdown_options = f.dropdown_options_str ? f.dropdown_options_str.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : null;
      const required_length = f.required_length;
      
      // Store config in placeholder to avoid DB schema changes
      const config = {
        required_length,
        dropdown_options
      };
      
      return {
        label: f.label,
        tag: f.tag,
        placeholder: JSON.stringify(config),
        // We don't send required_length and dropdown_options columns as they might not exist
      };
    });

    try {
      let queryId = this.route.snapshot.params['id'];

      if (this.isEdit) {
        const { error: updateError } = await this.supabase.client
          .from('queries')
          .update({ title, sql_content, sub_category_id, allowed_groups: this.allowedGroups })
          .eq('id', queryId);
        
        if (updateError) throw updateError;

        // Simple way: delete and recreate fields
        const { error: deleteError } = await this.supabase.client.from('dynamic_fields').delete().eq('query_id', queryId);
        if (deleteError) throw deleteError;
      } else {
        const { data, error: insertError } = await this.supabase.client
          .from('queries')
          .insert({ title, sql_content, sub_category_id, allowed_groups: this.allowedGroups })
          .select()
          .single();
        
        if (insertError) throw insertError;
        if (data) queryId = data.id;
      }

      if (fields.length > 0 && queryId) {
        const { error: fieldsError } = await this.supabase.client
          .from('dynamic_fields')
          .insert(fields.map((f: Partial<DynamicField>, i: number) => ({ ...f, query_id: queryId, order_index: i })));
        
        if (fieldsError) throw fieldsError;
      }

      this.router.navigate(['/admin/queries']);
    } catch (e: unknown) {
      const error = e as Error;
      console.error('Erreur lors de la sauvegarde:', error);
      alert(`Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}`);
    } finally {
      this.loading.set(false);
    }
  }
}
