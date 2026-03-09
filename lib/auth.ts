import { supabase } from './supabase';

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUp = (email: string, password: string, displayName: string) =>
  supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

export const signOut = () => supabase.auth.signOut();
