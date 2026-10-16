import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';
import { AVATAR_BUCKET, pathFromPublicUrl } from '@/lib/avatar-url';

/**
 * Target edge (px) for the stored avatar. The picker already crops to a square, so a
 * single dimension resizes both sides. 512 is comfortably above the largest on-screen
 * render (the `xl` Avatar is 96px, so this covers 3x retina + any future larger use)
 * while keeping the file tiny — a 512×512 JPEG at 0.7 compress is ~50–100 KB, far under
 * the bucket's 5 MB cap regardless of the source photo's megapixels.
 */
const AVATAR_EDGE_PX = 512;
const AVATAR_COMPRESS = 0.7;

/**
 * Resize + recompress a picked image down to a small square JPEG before upload.
 *
 * This is what actually keeps avatars small — the picker's `quality` only sets JPEG
 * compression, not pixel dimensions, so a modern phone's 12+ MP photo would still be
 * multi-megabyte (and can blow the bucket's 5 MB cap). Resizing to `AVATAR_EDGE_PX` is
 * the real size lever.
 *
 * Normalizing to **JPEG** here also makes format handling trivial and robust: whatever
 * comes in (JPEG/PNG/WEBP, or an iOS HEIC that slipped past the picker's Compatible
 * transcode) is decoded natively and re-encoded as JPEG, so the upload is always a
 * `.jpg`/`image/jpeg` the bucket accepts and every client can render. No mime sniffing
 * or HEIC-rejection guard is needed — the transcode subsumes it.
 */
async function processAvatarImage(localUri: string): Promise<string> {
  const ref = await ImageManipulator.manipulate(localUri)
    .resize({ width: AVATAR_EDGE_PX, height: AVATAR_EDGE_PX })
    .renderAsync();
  const result = await ref.saveAsync({ compress: AVATAR_COMPRESS, format: SaveFormat.JPEG });
  return result.uri;
}

/**
 * Uploads a locally-picked image (from `expo-image-picker`) to the `avatars` bucket
 * and returns its public URL.
 *
 * The image is first resized + recompressed to a small square JPEG (see
 * `processAvatarImage`) so we never upload a raw multi-megapixel photo.
 *
 * The object path is `<uid>/avatar-<timestamp>.jpg` — the leading `<uid>` folder is what
 * the storage RLS policies match against (`(storage.foldername(name))[1] = auth.uid()`),
 * so a user can only write under their own folder. The `<uid>` is read from the **live
 * Supabase session**, not a caller-passed id: the RLS check keys on the request's
 * `auth.uid()`, so deriving the folder from the same source guarantees they agree (a
 * stale/mismatched caller id — or a dev mock-login user with no real session, where
 * `auth.uid()` is null — would otherwise fail the INSERT with "new row violates RLS").
 * No session → a clear `NO_SESSION` error instead of an opaque RLS rejection. The
 * timestamp cache-busts: a public URL is otherwise stable per path, and reusing one path
 * would make `expo-image` (and any CDN) serve the previous photo after a re-upload.
 *
 * Reads the processed file straight to an `ArrayBuffer` via expo-file-system's `File`
 * (SDK 57 API) rather than base64 — Supabase's storage client accepts an ArrayBuffer
 * directly, which sidesteps the RN `Blob`/`FormData` upload pitfalls.
 */
export async function uploadAvatar(localUri: string, previousUrl?: string | null): Promise<string> {
  // Read the uid from the local session (no network round-trip) — its user id is the
  // same one Storage's RLS keys on via auth.uid().
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData.session?.user.id;
  if (!uid) throw new Error('NO_SESSION');

  const processedUri = await processAvatarImage(localUri);
  const path = `${uid}/avatar-${Date.now()}.jpg`;

  const bytes = await new File(processedUri).arrayBuffer();

  // NOT `upsert: true`: the object path is timestamped, so it never collides — a plain
  // insert is correct. `upsert` also makes storage-api do a preflight SELECT to decide
  // insert-vs-update, which needs a SELECT RLS policy on storage.objects; this bucket
  // deliberately has none (public reads go through the CDN, and a broad SELECT policy
  // would let clients enumerate the bucket), so `upsert` would fail the RLS check.
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, bytes, {
    contentType: 'image/jpeg',
  });
  if (error) throw error;

  // Replace, don't accumulate: the timestamped path means every photo change would
  // otherwise orphan the previous object in the bucket forever. Done AFTER the new
  // upload succeeds, so a failed upload can never leave the user with no avatar.
  //
  // Best-effort by design — the new avatar is already stored and recorded, so a
  // failed cleanup must not surface as a failed save. It only ever targets a path
  // under this user's own `<uid>/` folder (the DELETE policy would reject anything
  // else anyway), and `pathFromPublicUrl` returns null for a non-bucket URL such as
  // a social-login provider's avatar.
  //
  // ⚠️ This needs BOTH a DELETE and a SELECT policy. storage-api has to LOOK UP the
  // object before deleting it, and that lookup runs under the caller's RLS — with no
  // SELECT policy it matches zero rows, so `remove()` deletes nothing and still
  // returns **HTTP 200 with no error** (a silent no-op; the same class of trap as
  // `upsert` needing SELECT+UPDATE above). That is a real bug we shipped and caught
  // only by diffing the bucket against the storage logs. The `avatars` bucket now has
  // an owner-scoped SELECT policy gated with `storage.allow_only_operation` so it
  // still cannot be used to enumerate/list the bucket. Because the failure mode is
  // silent, `removeError` being null does NOT prove the object is gone.
  const previousPath = pathFromPublicUrl(previousUrl);
  if (previousPath && previousPath !== path && previousPath.startsWith(`${uid}/`)) {
    const { error: removeError } = await supabase.storage.from(AVATAR_BUCKET).remove([previousPath]);
    if (removeError) console.warn('[avatar-storage] failed to remove previous avatar', removeError);
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
