import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { i18n } from '@/i18n/i18n';
import { supabase } from '@/lib/supabase';
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

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'pt',
      setLocale: (locale: Locales) => {
        set({ locale });
        i18n.locale = locale;
        syncLocaleToUserMetadata(locale);
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
