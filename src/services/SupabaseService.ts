import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

class SupabaseServiceClass {
  private client: SupabaseClient | null = null;
  private currentUserId: string | null = null;

  initialize() {
    if (!this.client) {
      this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return this.client;
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      this.initialize();
    }
    return this.client!;
  }

  setCurrentUser(userId: string) {
    this.currentUserId = userId;
  }

  getCurrentUserId(): string {
    return this.currentUserId || 'default-user-id';
  }

  async ensureUser(name: string, email: string): Promise<string> {
    const client = this.getClient();

    const { data: existing, error: fetchError } = await client
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      this.setCurrentUser(existing.id);
      return existing.id;
    }

    const { data: newUser, error: createError } = await client
      .from('users')
      .insert({ name, email })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    this.setCurrentUser(newUser.id);
    return newUser.id;
  }
}

export const SupabaseService = new SupabaseServiceClass();

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function handleServiceError(error: any): Promise<ServiceResponse> {
  console.error('Service error:', error);
  return {
    success: false,
    error: error?.message || 'An unexpected error occurred',
  };
}
