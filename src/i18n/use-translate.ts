import type { TranslateOptions } from 'i18n-js';
import { useLocaleStore } from '@/stores/locale';
import { i18n, type TxKeyPath } from './i18n';

export function useTranslate() {
  const locale = useLocaleStore((s) => s.locale);

  // Bind the active locale into the returned function's identity so React Compiler
  // re-evaluates translate('constant-key') call sites after a language switch.
  // The plain `translate` helper reads i18n's mutable locale at call time, which
  // the compiler can't see — given a stable identity it memoizes those calls as
  // pure and they go stale until a full reload. A locale-keyed closure fixes that.
  return (key: TxKeyPath, options?: TranslateOptions) => i18n.t(key, locale ? { locale, ...options } : options);
}
