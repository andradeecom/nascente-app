/** Storage bucket holding user profile photos (public-read, owner-scoped writes). */
export const AVATAR_BUCKET = 'avatars';

/**
 * Recover the storage object path (`<uid>/avatar-<ts>.jpg`) from a public URL.
 *
 * We only persist the *public URL* (as `user_metadata.profileImageUrl`), never the
 * path, so replacing or cleaning up an avatar has to work backwards from it. Public
 * URLs look like `…/storage/v1/object/public/avatars/<uid>/avatar-<ts>.jpg`, so
 * everything after the bucket segment is the path.
 *
 * Returns null for anything that isn't a URL into this bucket — most importantly a
 * social-login provider's avatar (Google/Apple host their own), which we must never
 * attempt to delete. Kept in its own module (no `expo-file-system` /
 * `expo-image-manipulator` imports) so it stays pure and unit-testable; the upload
 * side lives in `avatar-storage.ts`.
 */
export function pathFromPublicUrl(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null;
  const marker = `/object/public/${AVATAR_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  const path = publicUrl.slice(index + marker.length).split('?')[0];
  return path ? decodeURIComponent(path) : null;
}
