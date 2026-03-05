import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Profile } from './types';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  user = signal<User | null>(null);
  profile = signal<Profile | null>(null);
  isConfigured = signal<boolean>(false);

  constructor() {
    let url = '';
    let key = '';

    // Try to get from various possible locations
    try {
      const globalWin = (typeof window !== 'undefined' ? window : {}) as Record<string, unknown>;
      
      url = url || (globalWin['SUPABASE_URL'] as string) || '';
      key = key || (globalWin['SUPABASE_ANON_KEY'] as string) || '';

      // Check import.meta.env (Vite/Modern Angular)
      const metaEnv = (import.meta as { env?: Record<string, string> }).env;
      url = url || metaEnv?.['SUPABASE_URL'] || metaEnv?.['VITE_SUPABASE_URL'] || '';
      key = key || metaEnv?.['SUPABASE_ANON_KEY'] || metaEnv?.['VITE_SUPABASE_ANON_KEY'] || '';

      // Check process.env (Node/SSR)
      if (typeof process !== 'undefined' && process.env) {
        url = url || process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'] || '';
        key = key || process.env['SUPABASE_ANON_KEY'] || process.env['VITE_SUPABASE_ANON_KEY'] || '';
      }
    } catch {
      // Ignore errors
    }
    
    if (!url || !key) {
      console.error('Supabase configuration missing! Please set SUPABASE_URL and SUPABASE_ANON_KEY in the Secrets panel.');
      this.isConfigured.set(false);
      // Initialize with dummy values to prevent crash, but app won't work
      this.supabase = createClient('https://placeholder.supabase.co', 'placeholder');
      return;
    }
    
    this.isConfigured.set(true);
    this.supabase = createClient(url, key);

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.user.set(session?.user ?? null);
      if (session?.user) {
        this.getProfile(session.user.id);
      } else {
        this.profile.set(null);
      }
    });
  }

  get client() {
    return this.supabase;
  }

  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      this.profile.set(data);
    }
    return { data, error };
  }

  async signOut() {
    await this.supabase.auth.signOut();
  }
}
