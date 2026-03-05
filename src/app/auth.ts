import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from './supabase';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div class="glass-card w-full max-w-md p-8 rounded-2xl">
        @if (!isConfigured()) {
          <div class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div class="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
              <mat-icon>warning</mat-icon>
              Configuration Supabase manquante
            </div>
            <p class="text-xs text-amber-700 leading-relaxed">
              Veuillez configurer les variables <strong>SUPABASE_URL</strong> et <strong>SUPABASE_ANON_KEY</strong>.
              <br><br>
              • Sur <strong>AI Studio</strong> : panneau Secrets.
              <br>
              • Sur <strong>Vercel</strong> : Environment Variables dans le Dashboard.
            </p>
          </div>
        }

        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 height-16 bg-primary text-white rounded-2xl mb-4 shadow-lg">
            <mat-icon class="text-3xl">database</mat-icon>
          </div>
          <h1 class="text-2xl font-bold text-slate-900">SQL Query Catalog</h1>
          <p class="text-slate-500">{{ isLogin() ? 'Connectez-vous à votre espace' : 'Créez votre compte consultant' }}</p>
        </div>

        <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="space-y-4">
          @if (!isLogin()) {
            <div>
              <label for="full_name" class="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
              <input id="full_name" type="text" formControlName="full_name" 
                class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all">
            </div>
          }
          
          <div>
            <label for="email" class="block text-sm font-medium text-slate-700 mb-1">Email professionnel</label>
            <input id="email" type="email" formControlName="email" 
              class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all">
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
            <input id="password" type="password" formControlName="password" 
              class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all">
          </div>

          @if (error()) {
            <div class="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <mat-icon class="text-sm">error</mat-icon>
              {{ error() }}
            </div>
          }

          @if (message()) {
            <div class="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg flex items-center gap-2">
              <mat-icon class="text-sm">check_circle</mat-icon>
              {{ message() }}
            </div>
          }

          <button type="submit" [disabled]="loading()"
            class="w-full py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            @if (loading()) {
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            }
            {{ isLogin() ? 'Se connecter' : "S'inscrire" }}
          </button>
        </form>

        <div class="mt-6 text-center space-y-4">
          <button (click)="toggleMode()" class="text-sm text-primary hover:underline font-medium block w-full text-center">
            {{ isLogin() ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter' }}
          </button>
          
          <div class="pt-4 border-t border-slate-100">
            <a routerLink="/" class="text-sm text-slate-500 hover:text-slate-800 flex items-center justify-center gap-2 transition-colors">
              <mat-icon class="text-lg">arrow_back</mat-icon>
              Retour à l'accueil
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuthComponent {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  isLogin = signal(true);
  loading = signal(false);
  error = signal<string | null>(null);
  message = signal<string | null>(null);
  isConfigured = this.supabase.isConfigured;

  authForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    full_name: ['']
  });

  toggleMode() {
    this.isLogin.update(v => !v);
    this.error.set(null);
    this.message.set(null);
  }

  async onSubmit() {
    if (this.authForm.invalid) return;

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    const { email, password, full_name } = this.authForm.value;

    try {
      if (this.isLogin()) {
        const { error } = await this.supabase.client.auth.signInWithPassword({
          email: email!,
          password: password!
        });
        if (error) throw error;
        this.router.navigate(['/']);
      } else {
        const { error } = await this.supabase.client.auth.signUp({
          email: email!,
          password: password!,
          options: {
            data: { full_name }
          }
        });
        if (error) throw error;
        this.message.set('Inscription réussie ! Votre compte est en attente de validation par l\'administrateur.');
      }
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      this.loading.set(false);
    }
  }
}
