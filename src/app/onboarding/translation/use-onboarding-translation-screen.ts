import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useLocaleStore } from '@/stores/locale';
import { useReaderStore } from '@/stores/reader';
import type { TranslationTier } from '@/components/molecules';
import type { TranslationId, Locales } from '@/types';
import { TRANSLATION_TIER } from '@/components/molecules/TranslationOption';

export type OnboardingTranslation = {
  key: string;
  tier: TranslationTier;
  translationId?: TranslationId;
  title: string;
  description: string;
  size: string;
};

export type OnboardingTranslationSection = {
  sectionKey: 'free' | 'pro';
  items: OnboardingTranslation[];
};

// Content is inherently locale-specific, so the catalog lives here keyed by locale.
// V1 ships public-domain only (no copyrighted/modern translations). Everything is
// bundled — `free` is available to all; `pro` is the same offline DB gated behind
// the Pro subscription (entitlement only). During onboarding the user hasn't paid,
// so Pro rows are shown locked (not selectable). See `.docs/bible-translation-licensing.md`.
const CATALOG: Record<Locales, OnboardingTranslationSection[]> = {
  pt: [
    {
      sectionKey: 'free',
      items: [
        {
          key: 'onbv',
          tier: TRANSLATION_TIER.Available,
          translationId: 'ONBV',
          title: 'Nova Bíblia Viva',
          description: 'Linguagem moderna e acessível',
          size: '5 MB',
        },
      ],
    },
    {
      sectionKey: 'pro',
      items: [
        {
          key: 'almeida1911',
          tier: TRANSLATION_TIER.Pro,
          translationId: 'Almeida',
          title: 'Almeida 1911',
          description: 'Tradução clássica em domínio público',
          size: '5 MB',
        },
        {
          key: 'biblialivre',
          tier: TRANSLATION_TIER.Pro,
          translationId: 'BibliaLivre',
          title: 'Bíblia Livre',
          description: 'Tradução livre e de leitura acessível',
          size: '5 MB',
        },
      ],
    },
  ],
  es: [
    {
      sectionKey: 'free',
      items: [
        {
          key: 'onbves',
          tier: TRANSLATION_TIER.Available,
          translationId: 'ONBVes',
          title: 'Nueva Biblia Viva',
          description: 'Lenguaje moderno y accesible',
          size: '5 MB',
        },
      ],
    },
    {
      sectionKey: 'pro',
      items: [
        {
          key: 'rv1909',
          tier: TRANSLATION_TIER.Pro,
          translationId: 'RV1909',
          title: 'Reina-Valera 1909',
          description: 'Traducción clásica de dominio público',
          size: '5 MB',
        },
        {
          key: 'sse',
          tier: TRANSLATION_TIER.Pro,
          translationId: 'SSE',
          title: 'Sagradas Escrituras 1569',
          description: 'Traducción histórica de dominio público',
          size: '5 MB',
        },
      ],
    },
  ],
  en: [
    {
      sectionKey: 'free',
      items: [
        {
          key: 'web',
          tier: TRANSLATION_TIER.Available,
          translationId: 'WEB',
          title: 'World English Bible',
          description: 'Modern public-domain English',
          size: '5 MB',
        },
      ],
    },
    {
      sectionKey: 'pro',
      items: [
        {
          key: 'kjv',
          tier: TRANSLATION_TIER.Pro,
          translationId: 'KJV',
          title: 'King James Version',
          description: 'Classic public-domain translation',
          size: '5 MB',
        },
        {
          key: 'asv',
          tier: TRANSLATION_TIER.Pro,
          translationId: 'ASV',
          title: 'American Standard Version',
          description: 'Precise public-domain classic',
          size: '5 MB',
        },
      ],
    },
  ],
};

export default function useOnboardingTranslationScreen() {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const setTranslation = useReaderStore((s) => s.setTranslation);

  const activeLocale: Locales = locale ?? 'pt';
  const sections = useMemo(() => CATALOG[activeLocale] ?? CATALOG.pt, [activeLocale]);

  const defaultKey = useMemo(() => {
    for (const section of sections) {
      const available = section.items.find((item) => item.tier === TRANSLATION_TIER.Available);
      if (available) return available.key;
    }
    return sections[0]?.items[0]?.key ?? '';
  }, [sections]);

  const [selectedKey, setSelectedKey] = useState(defaultKey);

  const selectedItem = useMemo(() => {
    for (const section of sections) {
      const match = section.items.find((item) => item.key === selectedKey);
      if (match) return match;
    }
    return undefined;
  }, [sections, selectedKey]);

  const handleSelect = (key: string) => setSelectedKey(key);

  const handleContinue = () => {
    if (selectedItem?.translationId) {
      setTranslation(selectedItem.translationId);
    }
    router.push('/onboarding/preferences');
  };

  const handleBack = () => router.back();

  return {
    sections,
    selectedKey,
    selectedName: selectedItem?.title ?? '',
    handleSelect,
    handleContinue,
    handleBack,
  };
}
