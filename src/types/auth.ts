import type { User as SupabaseUser } from '@supabase/supabase-js';

export type AppUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
};

export function toAppUser(user: SupabaseUser): AppUser {
  return {
    id: user.id,
    email: user.email ?? '',
    firstName: user.user_metadata.firstName ?? '',
    lastName: user.user_metadata.lastName ?? '',
    profileImageUrl: user.user_metadata.profileImageUrl ?? null,
  };
}

export type RegisterRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};
