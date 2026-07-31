import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { i18n } from '@/i18n/i18n';
import { supabase } from '@/lib/supabase';
import { useReaderStore } from '@/stores/reader';
import { TRANSLATIONS, defaultTranslationForLocale } from '@/types/bible';
import { Locales } from '@/types';

type LocaleState = {
  locale: Locales | null;
  setLocale: (locale: Locales) => void;
};

// Mirror the chosen locale into Supabase `user_metadata.locale`, which is the ONLY
// thing the send-email Auth Hook can read to decide which language to send auth
// emails in (supabase/functions/send-email). Signup stamps it directly (see
// `useRegister`); this keeps it current when the user later switches language, so
// e.g. a password-reset email a year from now still arrives in the right language.
// Fire-and-forget and best-effort: guests have no session (no-op), and a failed
// write must never block or fail the local language switch.
function syncLocaleToUserMetadata(locale: Locales) {
  void supabase.auth
    .getSession()
    .then(({ data }) => {
      if (!data.session) return;
      return supabase.auth.updateUser({ data: { locale } });
    })
    .catch(() => {
      // ignore — local locale already applied; re-synced on the next change
    });
}

// Follow the UI language with the reader's Bible translation, so switching to
// Spanish doesn't leave the reader (and the Home verse of the day, which resolves
// its text through the same `translationId`) showing Portuguese scripture.
//
// Deliberately conditional: only re-points the translation when the current one is
// in a DIFFERENT language than the new UI locale. A user reading KJV with an
// English UI who switches to Spanish gets RV1909, but someone who picked a
// specific same-language translation (e.g. Almeida over BibliaLivre in pt) keeps
// it — overwriting unconditionally would stomp a deliberate choice, including a
// Pro user's Pro-tier pick.
//
// `defaultTranslationForLocale` only ever returns a FREE bundled translation, so
// this can never move a non-Pro user onto a gated one.
function syncReaderTranslation(locale: Locales) {
  const { translationId } = useReaderStore.getState();

  if (TRANSLATIONS[translationId]?.lang === locale) return;

  const next = defaultTranslationForLocale(locale);
  if (next === translationId) return;

  // Sets `translationId` directly rather than calling `setTranslation`, which also
  // resets to Genesis 1 — right when the user deliberately picks a translation in
  // the reader, wrong here: changing the UI language shouldn't cost them their
  // reading position. Every bundled translation shares the 66-book/chapter
  // numbering, so the current bookId/chapter stays valid across the swap.
  useReaderStore.setState({ translationId: next });
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'pt',
      setLocale: (locale: Locales) => {
        set({ locale });
        i18n.locale = locale;
        syncLocaleToUserMetadata(locale);
        syncReaderTranslation(locale);
      },
    }),
    {
      name: 'nascente-locale',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.locale) {
          i18n.locale = state.locale;
        }
      },
    }
  )
);
