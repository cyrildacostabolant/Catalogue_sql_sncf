import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Profile } from './types';
import { env } from '../environments/env';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  user = signal<User | null>(null);
  profile = signal<Profile | null>(null);
  isConfigured = signal<boolean>(false);

  constructor() {
    let url = env.SUPABASE_URL;
    let key = env.SUPABASE_ANON_KEY;

    // Fallback for AI Studio environment variables if script didn't run or in dev
    if (!url || !key) {
      try {
        const globalWin = (typeof window !== 'undefined' ? window : {}) as Record<string, unknown>;
        url = url || (globalWin['SUPABASE_URL'] as string) || '';
        key = key || (globalWin['SUPABASE_ANON_KEY'] as string) || '';
      } catch (e) {
        console.warn('Could not access global window variables', e);
      }
    }
    
    if (!url || !key) {
      this.isConfigured.set(false);
      this.supabase = createClient('https://placeholder.supabase.co', 'placeholder');
      return;
    }
    
    this.isConfigured.set(true);
    this.supabase = createClient(url, key);

    this.supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth State Change:', _event, session?.user?.email);
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
    console.log('Fetching profile for:', userId);
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error.message, error.details);
    }

    if (data) {
      console.log('Profile loaded:', data);
      this.profile.set(data);
    } else {
      console.warn('No profile data found for user');
    }
    return { data, error };
  }

  async signOut() {
    await this.supabase.auth.signOut();
  }
}
