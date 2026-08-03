import type { User as SupabaseUser } from '@supabase/supabase-js';
import { toAppUser } from '../auth';

/**
 * `toAppUser` is the boundary between Supabase's `User` and the shape components
 * read (`ProfileCard`, the settings profile card, the home greeting). Every field
 * except `id` lives in the untyped `user_metadata` bag, so a provider that omits
 * one must degrade to a rendered empty string — never `undefined` leaking into a
 * `<Text>` as "undefined".
 */

function supabaseUser(overrides: Partial<SupabaseUser> = {}): SupabaseUser {
  return {
    id: 'user-1',
    email: 'edu@example.com',
    user_metadata: { firstName: 'Eduardo', lastName: 'Andrade' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as SupabaseUser;
}

describe('toAppUser', () => {
  it('maps id, email and the metadata name fields', () => {
    expect(toAppUser(supabaseUser())).toEqual({
      id: 'user-1',
      email: 'edu@example.com',
      firstName: 'Eduardo',
      lastName: 'Andrade',
      profileImageUrl: null,
    });
  });

  it('maps profileImageUrl when present', () => {
    const user = supabaseUser({
      user_metadata: { firstName: 'E', lastName: 'A', profileImageUrl: 'https://cdn/avatar.jpg' },
    });

    expect(toAppUser(user).profileImageUrl).toBe('https://cdn/avatar.jpg');
  });

  it('defaults a missing email to an empty string', () => {
    expect(toAppUser(supabaseUser({ email: undefined })).email).toBe('');
  });

  it('defaults missing names to empty strings rather than undefined', () => {
    // The Apple flow only returns a name on the very FIRST sign-in, so every
    // later session legitimately arrives with an empty metadata bag.
    const user = toAppUser(supabaseUser({ user_metadata: {} }));

    expect(user.firstName).toBe('');
    expect(user.lastName).toBe('');
  });

  it('defaults a missing profileImageUrl to null', () => {
    expect(toAppUser(supabaseUser({ user_metadata: {} })).profileImageUrl).toBeNull();
  });

  it('ignores unrelated metadata keys (e.g. the locale stamped for auth emails)', () => {
    const user = supabaseUser({
      user_metadata: { firstName: 'E', lastName: 'A', locale: 'pt', sub: 'apple|123' },
    });

    expect(Object.keys(toAppUser(user)).sort()).toEqual(['email', 'firstName', 'id', 'lastName', 'profileImageUrl']);
  });
});
