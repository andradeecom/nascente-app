import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useLocaleStore, type LocaleName } from '@/stores/locale';
import { useReaderStore } from '@/stores/reader';
import type { TranslationTier } from '@/components/molecules';
import type { TranslationId } from '@/types/bible';
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
  sectionKey: 'publicDomain' | 'freeLicensed' | 'pro';
  items: OnboardingTranslation[];
};

// Content is inherently locale-specific, so the catalog lives here keyed by locale.
// Only the `available` tier maps to a real bundled database; the other tiers are
// visual placeholders until downloads/subscriptions are implemented.
const CATALOG: Record<LocaleName, OnboardingTranslationSection[]> = {
  pt: [
    {
      sectionKey: 'publicDomain',
      items: [
        {
          key: 'almeida1911',
          tier: TRANSLATION_TIER.Available,
          translationId: 'Almeida',
          title: 'Almeida 1911',
          description: 'Tradução clássica em domínio público',
          size: '18 MB',
        },
      ],
    },
    {
      sectionKey: 'freeLicensed',
      items: [
        {
          key: 'almeidaRA',
          tier: TRANSLATION_TIER.Download,
          title: 'Almeida Revista e Atualizada',
          description: 'Linguagem moderna e fiel ao texto',
          size: '24 MB',
        },
      ],
    },
    {
      sectionKey: 'pro',
      items: [
        {
          key: 'nvi',
          tier: TRANSLATION_TIER.Pro,
          title: 'Nova Versão Internacional',
          description: 'Leitura natural e contemporânea',
          size: '22 MB',
        },
      ],
    },
  ],
  es: [
    {
      sectionKey: 'publicDomain',
      items: [
        {
          key: 'rv1909',
          tier: TRANSLATION_TIER.Available,
          translationId: 'RV1909',
          title: 'Reina-Valera 1909',
          description: 'Traducción clásica de dominio público',
          size: '18 MB',
        },
      ],
    },
    {
      sectionKey: 'freeLicensed',
      items: [
        {
          key: 'rv1960',
          tier: TRANSLATION_TIER.Download,
          title: 'Reina-Valera 1960',
          description: 'Lenguaje moderno y fiel al texto',
          size: '24 MB',
        },
      ],
    },
    {
      sectionKey: 'pro',
      items: [
        {
          key: 'nvi-es',
          tier: TRANSLATION_TIER.Pro,
          title: 'Nueva Versión Internacional',
          description: 'Lectura natural y contemporánea',
          size: '22 MB',
        },
      ],
    },
  ],
  en: [
    {
      sectionKey: 'publicDomain',
      items: [
        {
          key: 'kjv',
          tier: TRANSLATION_TIER.Available,
          translationId: 'KJV',
          title: 'King James Version',
          description: 'Classic public-domain translation',
          size: '18 MB',
        },
      ],
    },
    {
      sectionKey: 'freeLicensed',
      items: [
        {
          key: 'esv',
          tier: TRANSLATION_TIER.Download,
          title: 'English Standard Version',
          description: 'Modern, faithful to the text',
          size: '24 MB',
        },
      ],
    },
    {
      sectionKey: 'pro',
      items: [
        {
          key: 'niv',
          tier: TRANSLATION_TIER.Pro,
          title: 'New International Version',
          description: 'Natural, contemporary reading',
          size: '22 MB',
        },
      ],
    },
  ],
};

export default function useOnboardingTranslationScreen() {
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const setTranslation = useReaderStore((s) => s.setTranslation);

  const activeLocale: LocaleName = locale ?? 'pt';
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
