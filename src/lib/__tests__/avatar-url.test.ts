import { pathFromPublicUrl } from '../avatar-url';

/**
 * `pathFromPublicUrl` decides which storage object gets DELETED when a user
 * replaces their avatar, so a wrong answer either leaks objects (returns null when
 * it shouldn't) or targets something it must not touch. The provider-URL case is
 * the security-relevant one: Google/Apple host their own avatars, and those must
 * never be parsed into a path we then hand to `remove()`.
 */

const BASE = 'https://djnhodhdpjxkiqehixsf.supabase.co/storage/v1/object/public/avatars';
const UID = '6836d64b-9852-4376-8c69-ca0e0c9b43f4';

describe('pathFromPublicUrl', () => {
  it('extracts the <uid>/<file> path from a public avatar URL', () => {
    expect(pathFromPublicUrl(`${BASE}/${UID}/avatar-1750000000000.jpg`)).toBe(`${UID}/avatar-1750000000000.jpg`);
  });

  it('drops a cache-busting query string', () => {
    expect(pathFromPublicUrl(`${BASE}/${UID}/avatar-1.jpg?t=123`)).toBe(`${UID}/avatar-1.jpg`);
  });

  it('returns null for a social-login provider URL (never ours to delete)', () => {
    expect(pathFromPublicUrl('https://lh3.googleusercontent.com/a/ACg8ocK123=s96-c')).toBeNull();
    expect(pathFromPublicUrl('https://appleid.cdn-apple.com/avatar/abc.png')).toBeNull();
  });

  it('returns null for a URL into a different bucket', () => {
    expect(
      pathFromPublicUrl('https://djnhodhdpjxkiqehixsf.supabase.co/storage/v1/object/public/other/x/y.jpg')
    ).toBeNull();
  });

  it('returns null for empty/missing input', () => {
    expect(pathFromPublicUrl(null)).toBeNull();
    expect(pathFromPublicUrl(undefined)).toBeNull();
    expect(pathFromPublicUrl('')).toBeNull();
  });

  it('returns null when the bucket segment has no path after it', () => {
    expect(pathFromPublicUrl(`${BASE}/`)).toBeNull();
  });

  it('decodes percent-encoded segments so the path matches the stored object key', () => {
    expect(pathFromPublicUrl(`${BASE}/${UID}/avatar%20copy.jpg`)).toBe(`${UID}/avatar copy.jpg`);
  });
});
