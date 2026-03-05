import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../supabase';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Query, DynamicField } from '../types';

@Component({
  selector: 'app-query-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, FormsModule],
  template: `
    <div class="p-8 max-w-5xl mx-auto">
      <div class="flex items-center gap-4 mb-8">
        <button routerLink="/catalog" class="p-2 hover:bg-slate-200 rounded-full transition-all">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-bold uppercase tracking-widest text-primary bg-blue-50 px-2 py-0.5 rounded">
              {{ query()?.sub_categories?.categories?.name }}
            </span>
            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              / {{ query()?.sub_categories?.name }}
            </span>
          </div>
          <h1 class="text-3xl font-bold text-slate-900">{{ query()?.title }}</h1>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Form -->
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 class="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <mat-icon class="text-primary">tune</mat-icon>
              Paramètres
            </h3>
            
            <div class="space-y-4">
              @for (field of query()?.dynamic_fields; track field.id) {
                <div>
                  <label [for]="field.tag" class="block text-sm font-bold text-slate-700 mb-1">{{ field.label }}</label>
                  <input [id]="field.tag" type="text" 
                    [ngModel]="fieldValues()[field.tag]" 
                    (ngModelChange)="updateValue(field.tag, $event)"
                    class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all"
                    [placeholder]="field.placeholder || 'Saisir une valeur...'">
                </div>
              } @empty {
                <p class="text-sm text-slate-400 italic">Aucun paramètre dynamique pour cette requête.</p>
              }
            </div>
          </div>

          <button (click)="copyToClipboard()" 
            class="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
            <mat-icon>content_copy</mat-icon>
            Copier la requête
          </button>

          @if (copied()) {
            <div class="flex items-center justify-center gap-2 text-success font-bold text-sm animate-bounce">
              <mat-icon>check_circle</mat-icon>
              Copié dans le presse-papier !
            </div>
          }
        </div>

        <!-- SQL Preview -->
        <div class="lg:col-span-2">
          <div class="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex flex-col h-full min-h-[400px]">
            <div class="bg-slate-800 px-6 py-3 flex items-center justify-between border-b border-slate-700">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Génération Live SQL</span>
              <div class="flex gap-1.5">
                <div class="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-amber-500/20"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-emerald-500/20"></div>
              </div>
            </div>
            <div class="flex-1 p-6 font-mono text-sm text-emerald-400 overflow-auto whitespace-pre-wrap leading-relaxed">
              {{ liveSql() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class QueryDetailComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private route = inject(ActivatedRoute);

  query = signal<Query | null>(null);
  fieldValues = signal<Record<string, string>>({});
  copied = signal(false);

  liveSql = computed(() => {
    const q = this.query();
    const values = this.fieldValues();
    if (!q) return '';
    
    let sql = q.sql_content;
    Object.entries(values).forEach(([tag, value]) => {
      if (value) {
        const regex = new RegExp(`\\{\\{${tag}\\}\\}`, 'g');
        sql = sql.replace(regex, value);
      }
    });
    return sql;
  });

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadQuery(id);
  }

  async loadQuery(id: string) {
    const { data } = await this.supabase.client
      .from('queries')
      .select('*, dynamic_fields(*), sub_categories(name, categories(name))')
      .eq('id', id)
      .single();
    
    if (data) {
      this.query.set(data as unknown as Query);
      // Initialize field values
      const initialValues: Record<string, string> = {};
      data.dynamic_fields.forEach((f: DynamicField) => {
        initialValues[f.tag] = '';
      });
      this.fieldValues.set(initialValues);
    }
  }

  updateValue(tag: string, value: string) {
    this.fieldValues.update(prev => ({ ...prev, [tag]: value }));
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.liveSql());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
