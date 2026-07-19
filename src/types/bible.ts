export type TranslationId =
  // Free, bundled, public-domain — available to everyone offline from install.
  | 'ONBV'
  | 'ONBVes'
  | 'WEB'
  // Pro, bundled, public-domain — gated behind the Pro subscription (entitlement
  // only; the DBs ship in the app, so unlock is instant + offline). V1 is
  // public-domain only — no copyrighted/modern translations until V2.
  | 'Almeida'
  | 'RV1909'
  | 'KJV'
  | 'BibliaLivre'
  | 'SSE'
  | 'ASV';

/**
 * Total chapters in the 66-book Protestant canon (all bundled translations).
 * Denominator for the Home "overall Bible progress" stat — translation-independent.
 */
export const TOTAL_BIBLE_CHAPTERS = 1189;

/**
 * Tier gate for a translation. `free` = bundled public-domain, available to
 * everyone. `pro` = bundled public-domain gated behind the Pro subscription
 * (entitlement check only — the DB still ships in the app, so unlock is instant
 * and offline). V1 ships public-domain only; copyrighted/modern translations
 * (NVI, ARA, ESV, …) are deferred to V2 (see `.docs/bible-translation-licensing.md`).
 */
export type TranslationTier = 'free' | 'pro';

export type TranslationMeta = {
  id: TranslationId;
  label: string;
  lang: 'pt' | 'es' | 'en';
  tier: TranslationTier;
  dbFile: string;
  booksTable: string;
  versesTable: string;
};

export type Book = {
  id: number;
  name: string;
};

export type Verse = {
  id: number;
  bookId: number;
  chapter: number;
  verse: number;
  text: string;
};

export type ChapterInfo = {
  chapter: number;
};

export type SearchResult = {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
};

export const TRANSLATIONS: Record<TranslationId, TranslationMeta> = {
  // --- Free (bundled, public-domain) ---
  ONBV: {
    id: 'ONBV',
    label: 'Open Nova Bíblia Viva (Biblica)',
    lang: 'pt',
    tier: 'free',
    dbFile: 'ONBV.db',
    booksTable: 'ONBV_books',
    versesTable: 'ONBV_verses',
  },
  ONBVes: {
    id: 'ONBVes',
    label: 'Open Nueva Biblia Viva (Biblica)',
    lang: 'es',
    tier: 'free',
    dbFile: 'ONBVes.db',
    booksTable: 'ONBVes_books',
    versesTable: 'ONBVes_verses',
  },
  WEB: {
    id: 'WEB',
    label: 'World English Bible',
    lang: 'en',
    tier: 'free',
    dbFile: 'WEB.db',
    booksTable: 'WEB_books',
    versesTable: 'WEB_verses',
  },
  // --- Pro (bundled, public-domain — gated by entitlement only) ---
  Almeida: {
    id: 'Almeida',
    label: 'Almeida 1911',
    lang: 'pt',
    tier: 'pro',
    dbFile: 'Almeida.db',
    booksTable: 'Almeida_books',
    versesTable: 'Almeida_verses',
  },
  RV1909: {
    id: 'RV1909',
    label: 'Reina-Valera 1909',
    lang: 'es',
    tier: 'pro',
    dbFile: 'RV1909.db',
    booksTable: 'RV1909_books',
    versesTable: 'RV1909_verses',
  },
  KJV: {
    id: 'KJV',
    label: 'KJV',
    lang: 'en',
    tier: 'pro',
    dbFile: 'KJV.db',
    booksTable: 'KJV_books',
    versesTable: 'KJV_verses',
  },
  BibliaLivre: {
    id: 'BibliaLivre',
    label: 'Bíblia Livre',
    lang: 'pt',
    tier: 'pro',
    dbFile: 'BibliaLivre.db',
    booksTable: 'BibliaLivre_books',
    versesTable: 'BibliaLivre_verses',
  },
  SSE: {
    id: 'SSE',
    label: 'Sagradas Escrituras 1569',
    lang: 'es',
    tier: 'pro',
    dbFile: 'SSE.db',
    booksTable: 'SSE_books',
    versesTable: 'SSE_verses',
  },
  ASV: {
    id: 'ASV',
    label: 'American Standard Version',
    lang: 'en',
    tier: 'pro',
    dbFile: 'ASV.db',
    booksTable: 'ASV_books',
    versesTable: 'ASV_verses',
  },
  // YLT: {
  //   id: 'YLT',
  //   label: "Young's Literal Translation",
  //   lang: 'en',
  //   tier: 'pro',
  //   dbFile: 'YLT.db',
  //   booksTable: 'YLT_books',
  //   versesTable: 'YLT_verses',
  // },
};

/** All translations available to everyone (bundled, public-domain). */
export const FREE_TRANSLATIONS: TranslationMeta[] = Object.values(TRANSLATIONS).filter((t) => t.tier === 'free');

/** Pro-gated translations (bundled, public-domain; unlocked by the Pro subscription). */
export const PRO_TRANSLATIONS: TranslationMeta[] = Object.values(TRANSLATIONS).filter((t) => t.tier === 'pro');

/**
 * Source / license credit for a bundled translation. Drives the Credits screen
 * (`settings/credits`). Any title under a license that requires attribution
 * (CC-BY / CC-BY-SA) MUST appear here with `requiresAttribution: true` — this is
 * a licensing obligation, not a nicety. Public-domain / GPL titles are listed too
 * (good practice) but don't strictly require it.
 *
 * Verified 2026-06 against each source's license page — keep in sync with
 * `scripts/build-bible-dbs*.mjs` and `.docs/bible-translation-licensing.md`.
 */
export type TranslationCredit = {
  id: TranslationId;
  title: string;
  license: string;
  /** CC-BY / CC-BY-SA → true. PD / GPL → false. */
  requiresAttribution: boolean;
  copyright?: string;
  licenseUrl?: string;
  /** eBible.org / getBible source page. */
  sourceUrl: string;
};

export const TRANSLATION_CREDITS: TranslationCredit[] = [
  // --- Free (bundled) ---
  {
    id: 'ONBV',
    title: 'Open Nova Bíblia Viva (Biblica)',
    license: 'CC BY-SA 4.0',
    requiresAttribution: true,
    copyright: '© 2007, 2010 Biblica, Inc.',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://ebible.org/Scriptures/details.php?id=poronbv',
  },
  {
    id: 'ONBVes',
    title: 'Open Nueva Biblia Viva (Biblica)',
    license: 'CC BY-SA 4.0',
    requiresAttribution: true,
    copyright: '© 2008 Biblica, Inc.',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://ebible.org/Scriptures/details.php?id=spaonbv',
  },
  {
    id: 'WEB',
    title: 'World English Bible',
    license: 'Public Domain',
    requiresAttribution: false,
    sourceUrl: 'https://api.getbible.net/v2/web',
  },
  // --- Pro (bundled) ---
  {
    id: 'Almeida',
    title: 'Almeida Atualizada (1911)',
    license: 'GPL / Public Domain',
    requiresAttribution: false,
    sourceUrl: 'https://api.getbible.net/v2/almeida',
  },
  {
    id: 'RV1909',
    title: 'Reina-Valera 1909',
    license: 'Public Domain',
    requiresAttribution: false,
    sourceUrl: 'https://ebible.org/Scriptures/details.php?id=spaRV1909',
  },
  {
    id: 'KJV',
    title: 'King James Version',
    license: 'GPL / Public Domain',
    requiresAttribution: false,
    sourceUrl: 'https://api.getbible.net/v2/kjv',
  },
  {
    id: 'BibliaLivre',
    title: 'Bíblia Livre',
    license: 'CC BY 4.0',
    requiresAttribution: true,
    copyright: '© 2018 Diego Santos, Mario Sérgio, e Marco Teles',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    sourceUrl: 'https://ebible.org/Scriptures/details.php?id=porbr2018',
  },
  {
    id: 'SSE',
    title: 'Sagradas Escrituras (1569)',
    license: 'Public Domain',
    requiresAttribution: false,
    sourceUrl: 'https://api.getbible.net/v2/sse',
  },
  {
    id: 'ASV',
    title: 'American Standard Version',
    license: 'Public Domain',
    requiresAttribution: false,
    sourceUrl: 'https://api.getbible.net/v2/asv',
  },
  // {
  //   id: 'YLT',
  //   title: "Young's Literal Translation",
  //   license: 'Public Domain',
  //   requiresAttribution: false,
  //   sourceUrl: 'https://api.getbible.net/v2/ylt',
  // },
];

export function defaultTranslationForLocale(locale: string): TranslationId {
  if (locale.startsWith('pt')) return 'ONBV';
  if (locale.startsWith('es')) return 'ONBVes';
  return 'WEB';
}
